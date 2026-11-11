"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightLeft } from "lucide-react";
import { BuyMailboxModal } from "@/components/buy-mailbox-modal";
import { StatusBadge } from "@/components/status-badge";
type Mailbox = {
  id: string;
  email: string;
  status: string;
  blocked_reason: string | null;
  quota_mb: number | null;
  mail_blocked?: boolean;
  access_blocked?: boolean;
  access_paused?: boolean;
};

type Entitlement = {
  entitled: boolean;
  planCode: string | null;
  planMailboxes?: number;
  extraMailboxes?: number;
  maxMailboxes: number;
  usedMailboxes?: number;
  usedStorageMb?: number;
  maxStorageMb?: number;
  mailboxSlots?: Record<string, number>;
} | null;

function mailboxStatus(mailbox: Mailbox) {
  if (mailbox.status === "blocked") return "blocked";
  if (mailbox.access_paused) return "paused";
  if (mailbox.access_blocked || mailbox.mail_blocked) return "blocked";
  return "active";
}

export function MailboxesPanel({
  mailboxes,
  entitlement,
  domains,
  webmailUrl,
  admins: initialAdmins = {},
  adminsEnabled = false,
  adminsError = null,
}: {
  mailboxes: Mailbox[];
  entitlement: Entitlement;
  domains: string[];
  webmailUrl: string;
  admins?: Record<string, string[]>;
  adminsEnabled?: boolean;
  adminsError?: string | null;
}) {
  const router = useRouter();
  const [admins, setAdmins] = useState(initialAdmins);
  const [savingAdmin, setSavingAdmin] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(adminsError);

  async function toggleAdmin(email: string, admin: boolean) {
    setSavingAdmin(email);
    setAdminError(null);
    const response = await fetch("/api/mailboxes/admins", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, admin }),
    });
    const payload = await response.json().catch(() => ({}));
    setSavingAdmin(null);
    if (!response.ok) {
      setAdminError(payload.error || "Não foi possível salvar o admin");
      return;
    }
    setAdmins((prev) => ({ ...prev, [payload.domain]: payload.admins }));
  }
  const [buyOpen, setBuyOpen] = useState(false);
  const [localPart, setLocalPart] = useState("");
  const [domain, setDomain] = useState(domains[0] ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const used = entitlement?.usedMailboxes ?? mailboxes.length;
  const max = entitlement?.maxMailboxes ?? 0;
  const canCreate = max > 0 && used < max && domains.length > 0;
  const storageUsed = entitlement?.usedStorageMb ?? 0;
  const storageMax = entitlement?.maxStorageMb ?? 0;

  const emailPreview = useMemo(() => {
    if (!localPart || !domain) return "";
    return `${localPart}@${domain}`.toLowerCase();
  }, [localPart, domain]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setCreatedPassword(null);

    const response = await fetch("/api/mailboxes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailPreview,
        password: password || undefined,
      }),
    });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error || "Não foi possível criar a caixa");
      return;
    }

    setCreatedPassword(payload.password);
    setLocalPart("");
    setPassword("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="wg-card p-5 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-wg-text-muted uppercase">Uso</p>
          <p className="mt-2 font-display text-2xl font-semibold text-wg-graphite">
            {used} / {max}
          </p>
        </div>
        <div className="wg-card p-5 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-wg-text-muted uppercase">
            Assinaturas
          </p>
          <p className="mt-2 font-display text-2xl font-semibold text-wg-graphite">
            {entitlement?.extraMailboxes ?? 0}
          </p>
          <p className="mt-1 text-xs text-wg-text-muted">Caixas contratadas</p>
        </div>
        <div className="wg-card p-5 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-wg-text-muted uppercase">
            Armazenamento
          </p>
          <p className="mt-2 font-display text-2xl font-semibold text-wg-graphite">
            {storageUsed} / {storageMax} MB
          </p>
          <p className="mt-1 text-xs text-wg-text-muted">
            Start 2 GB · Business 5 GB · Business Plus 10 GB
          </p>
        </div>
        <div className="wg-card p-5 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-wg-text-muted uppercase">
            Disponíveis
          </p>
          <p className="mt-2 font-display text-2xl font-semibold text-wg-graphite">
            {Math.max(0, max - used)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 wg-card p-5 shadow-sm">
        <div>
          <h2 className="font-display text-lg font-semibold text-wg-graphite">
            Assinar caixas de entrada
          </h2>
          <p className="mt-1 text-sm text-wg-text-muted">
            Sem caixas grátis. Contrate um plano (mensal ou anual) e depois crie os e-mails.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBuyOpen(true)}
          className="wg-btn"
        >
          Comprar caixas
        </button>
      </div>

      <Link
        href="/migracao"
        className="group flex flex-wrap items-center justify-between gap-3 wg-card p-5 transition hover:border-wg-brand/30"
      >
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-wg-brand/[0.08] text-wg-brand">
            <ArrowRightLeft className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-wg-graphite">
              Trazer e-mails de outro provedor
            </h2>
            <p className="mt-0.5 text-sm text-wg-text-muted">
              Copie mensagens e pastas da conta antiga para uma caixa WebGeele, sem apagar nada na origem.
            </p>
          </div>
        </div>
        <span className="text-sm font-semibold text-wg-brand transition group-hover:translate-x-0.5">
          Iniciar migração →
        </span>
      </Link>

      <div className="wg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-wg-graphite">
              Criar caixa de e-mail
            </h2>
            <p className="mt-1 text-sm text-wg-text-muted">
              Usa somente a cota das suas assinaturas.
            </p>
          </div>
          <a
            href={webmailUrl}
            target="_blank"
            rel="noreferrer"
            className="wg-btn-secondary"
          >
            Abrir webmail
          </a>
        </div>
        <form onSubmit={onCreate} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <input
            required
            placeholder="usuario"
            value={localPart}
            onChange={(e) => setLocalPart(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))}
            disabled={domains.length === 0}
            className="wg-input disabled:opacity-50"
          />
          <select
            required
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            disabled={domains.length === 0}
            className="wg-input disabled:opacity-50"
          >
            {domains.length === 0 ? (
              <option value="">Cadastre um domínio primeiro</option>
            ) : (
              domains.map((item) => (
                <option key={item} value={item}>
                  @{item}
                </option>
              ))
            )}
          </select>
          <input
            placeholder="Senha (opcional)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="wg-input"
          />
          <button
            type="submit"
            disabled={loading || !emailPreview || !canCreate}
            className="wg-btn disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar"}
          </button>
        </form>
        {max <= 0 ? (
          <p className="mt-3 text-sm text-wg-text-muted">
            Nenhuma assinatura ainda. Clique em Comprar caixas para iniciar.
          </p>
        ) : null}
        {max > 0 && used >= max ? (
          <p className="mt-3 text-sm text-wg-text-muted">
            Cota cheia. Compre mais caixas para liberar novos e-mails.
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="wg-alert-error">{error}</p>
      ) : null}
      {createdPassword ? (
        <p className="wg-alert-success">
          Caixa criada. Senha: <strong>{createdPassword}</strong>
        </p>
      ) : null}

      {adminError ? <p className="wg-alert-error">{adminError}</p> : null}

      <div className="overflow-hidden wg-card">
        <table className="w-full text-left text-sm">
          <thead className="wg-table-head">
            <tr>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Armazenamento</th>
              {adminsEnabled ? (
                <th className="px-4 py-3 font-medium" title="Edita o perfil da empresa no webmail">
                  Admin da empresa
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {mailboxes.length === 0 ? (
              <tr>
                <td colSpan={adminsEnabled ? 4 : 3} className="px-4 py-8 text-center text-wg-text-muted">
                  Nenhuma caixa ainda.
                </td>
              </tr>
            ) : (
              mailboxes.map((mailbox) => (
                <tr key={mailbox.id} className="border-b border-wg-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-wg-graphite">{mailbox.email}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={mailboxStatus(mailbox)} />
                  </td>
                  <td className="px-4 py-3">
                    {mailbox.quota_mb
                      ? `${(mailbox.quota_mb / 1024).toFixed(0)} GB`
                      : "—"}
                  </td>
                  {adminsEnabled ? (
                    <td className="px-4 py-3">
                      {(() => {
                        const domain = mailbox.email.split("@")[1] ?? "";
                        const isAdmin = (admins[domain] ?? []).includes(mailbox.email.toLowerCase());
                        return (
                          <label className="inline-flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isAdmin}
                              disabled={savingAdmin !== null}
                              onChange={(e) => void toggleAdmin(mailbox.email, e.target.checked)}
                              className="h-4 w-4 accent-current"
                            />
                            <span className={isAdmin ? "font-medium text-wg-graphite" : "text-wg-text-muted"}>
                              {savingAdmin === mailbox.email ? "Salvando..." : isAdmin ? "Admin" : "—"}
                            </span>
                          </label>
                        );
                      })()}
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <BuyMailboxModal open={buyOpen} onClose={() => setBuyOpen(false)} />
    </div>
  );
}
