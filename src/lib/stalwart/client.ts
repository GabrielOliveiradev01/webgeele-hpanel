import { env } from "@/lib/env";

export type StalwartPrincipal = {
  id: number;
  type: string;
  name: string;
  description?: string;
  emails?: string[];
  roles?: string[];
  quota?: number;
  usedQuota?: number;
  disabledPermissions?: string[];
  secrets?: string[];
};

type StalwartListResponse = {
  data?: {
    items?: StalwartPrincipal[];
    total?: number;
  };
  error?: string;
};

type StalwartOneResponse = {
  data?: StalwartPrincipal;
  error?: string;
  item?: string;
};

const BLOCK_PERMISSIONS = [
  "authenticate",
  "email-send",
  "email-receive",
] as const;

export function disabledPermissionsFor(mailbox: {
  status: string;
  mail_blocked: boolean;
  access_blocked: boolean;
  access_paused: boolean;
}) {
  const billingBlocked = mailbox.status === "blocked";
  const permissions: string[] = [];
  if (billingBlocked || mailbox.access_blocked || mailbox.access_paused) {
    permissions.push("authenticate");
  }
  if (billingBlocked || mailbox.mail_blocked) {
    permissions.push("email-send", "email-receive");
  }
  return permissions;
}

function stalwartConfigured() {
  return Boolean(
    env.stalwartApiUrl() && env.stalwartApiUser() && env.stalwartApiPassword(),
  );
}

async function stalwartFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!stalwartConfigured()) {
    throw new Error("Stalwart não configurado (URL/usuário/senha)");
  }

  const auth = Buffer.from(
    `${env.stalwartApiUser()}:${env.stalwartApiPassword()}`,
  ).toString("base64");

  const response = await fetch(
    `${env.stalwartApiUrl().replace(/\/$/, "")}${path}`,
    {
      ...init,
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    },
  );

  const text = await response.text();
  const body = text ? (JSON.parse(text) as T & { error?: string; detail?: string }) : ({} as T);

  if (!response.ok) {
    throw new Error(
      `Stalwart ${response.status}: ${(body as { detail?: string; error?: string }).detail || (body as { error?: string }).error || text}`,
    );
  }

  return body;
}

export type StalwartDnsRecord = {
  type: string;
  name: string;
  content: string;
};

export function createStalwartClient() {
  return {
    configured: stalwartConfigured,

    listPrincipals(types?: string, limit = 200) {
      const query = new URLSearchParams({ limit: String(limit) });
      if (types) query.set("types", types);
      return stalwartFetch<StalwartListResponse>(`/api/principal?${query}`);
    },

    listDomains() {
      return this.listPrincipals("domain");
    },

    listIndividuals() {
      return this.listPrincipals("individual");
    },

    getPrincipal(name: string) {
      return stalwartFetch<StalwartOneResponse>(
        `/api/principal/${encodeURIComponent(name)}`,
      );
    },

    getDnsRecords(domain: string) {
      return stalwartFetch<{ data?: StalwartDnsRecord[] }>(
        `/api/dns/records/${encodeURIComponent(domain)}`,
      );
    },

    createDkimSignature(input: {
      domain: string;
      algorithm: "Ed25519" | "Rsa";
      selector?: string;
    }) {
      return stalwartFetch<{ data: null }>("/api/dkim", {
        method: "POST",
        body: JSON.stringify({
          algorithm: input.algorithm,
          domain: input.domain,
          ...(input.selector ? { selector: input.selector } : {}),
        }),
      });
    },

    createDomain(name: string, description?: string) {
      return stalwartFetch<{ data: number }>("/api/principal", {
        method: "POST",
        body: JSON.stringify({
          type: "domain",
          name,
          description: description || name,
        }),
      });
    },

    createMailbox(input: {
      email: string;
      password: string;
      description?: string;
      quotaBytes?: number;
    }) {
      return stalwartFetch<{ data: number }>("/api/principal", {
        method: "POST",
        body: JSON.stringify({
          type: "individual",
          name: input.email,
          description: input.description || input.email,
          quota: input.quotaBytes ?? 0,
          secrets: [input.password],
          emails: [input.email],
          roles: ["user"],
        }),
      });
    },

    async patchPrincipal(
      name: string,
      actions: Array<{
        action: string;
        field: string;
        value: string | number | boolean | string[];
      }>,
    ) {
      return stalwartFetch<{ data: null }>(
        `/api/principal/${encodeURIComponent(name)}`,
        {
          method: "PATCH",
          body: JSON.stringify(actions),
        },
      );
    },

    async setDisabledPermissions(email: string, wanted: string[]) {
      let current: string[] = [];
      try {
        const principal = await this.getPrincipal(email);
        current = principal.data?.disabledPermissions ?? [];
      } catch {
        current = [];
      }

      const actions: Array<{
        action: string;
        field: string;
        value: string;
      }> = [];

      for (const permission of BLOCK_PERMISSIONS) {
        const has = current.includes(permission);
        const need = wanted.includes(permission);
        if (need && !has) {
          actions.push({
            action: "addItem",
            field: "disabledPermissions",
            value: permission,
          });
        }
        if (!need && has) {
          actions.push({
            action: "removeItem",
            field: "disabledPermissions",
            value: permission,
          });
        }
      }

      if (actions.length === 0) return;
      await this.patchPrincipal(email, actions);
    },

    async setMailboxBlocked(email: string, blocked: boolean) {
      await this.setDisabledPermissions(email, blocked ? [...BLOCK_PERMISSIONS] : []);
    },

    async setMailboxPassword(email: string, password: string) {
      await this.patchPrincipal(email, [
        { action: "set", field: "secrets", value: [password] },
      ]);
    },

    deleteMailbox(email: string) {
      return stalwartFetch<{ data: null }>(
        `/api/principal/${encodeURIComponent(email)}`,
        { method: "DELETE" },
      );
    },

    isBlocked(principal: StalwartPrincipal) {
      const disabled = principal.disabledPermissions ?? [];
      return BLOCK_PERMISSIONS.some((permission) => disabled.includes(permission));
    },
  };
}

export async function setMailboxBlockedInStalwart(
  stalwartAccountId: string,
  blocked: boolean,
) {
  const client = createStalwartClient();
  if (!client.configured()) {
    return { ok: false, skipped: true as const };
  }

  await client.setMailboxBlocked(stalwartAccountId, blocked);

  return { ok: true as const, skipped: false as const };
}

export async function setAccountMailboxesBlocked(
  accountId: string,
  blocked: boolean,
) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const client = createStalwartClient();

  const { data: mailboxes, error } = await admin
    .from("mailboxes")
    .select(
      "id, email, stalwart_account_id, status, mail_blocked, access_blocked, access_paused",
    )
    .eq("account_id", accountId)
    .neq("status", "deleted");

  if (error) throw error;

  for (const mailbox of mailboxes ?? []) {
    const principalName = mailbox.stalwart_account_id || mailbox.email;

    const nextStatus = blocked ? "blocked" : "active";
    await admin
      .from("mailboxes")
      .update({
        status: nextStatus,
        blocked_reason: null,
      })
      .eq("id", mailbox.id);

    if (client.configured() && principalName) {
      const wanted = disabledPermissionsFor({
        status: nextStatus,
        mail_blocked: Boolean(mailbox.mail_blocked),
        access_blocked: Boolean(mailbox.access_blocked),
        access_paused: Boolean(mailbox.access_paused),
      });
      try {
        await client.setDisabledPermissions(principalName, wanted);
      } catch (error) {
        console.error("Stalwart block sync failed", mailbox.email, error);
      }
    }
  }

  return { count: mailboxes?.length ?? 0, blocked };
}
