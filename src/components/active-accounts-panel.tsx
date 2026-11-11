"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Shield } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";

export type ActiveMailbox = {
  id: string;
  email: string;
  status: string;
  quota_mb: number | null;
  domainName: string;
  mail_blocked: boolean;
  access_blocked: boolean;
  access_paused: boolean;
  is_domain_admin: boolean;
};

export function ActiveAccountsPanel({
  mailboxes,
  webmailUrl,
}: {
  mailboxes: ActiveMailbox[];
  webmailUrl: string;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(mailboxes[0]?.id ?? "");
  const [domain, setDomain] = useState("todos");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const domains = useMemo(
    () => [...new Set(mailboxes.map((mailbox) => mailbox.domainName))].sort(),
    [mailboxes],
  );
  const visible = mailboxes.filter(
    (mailbox) => domain === "todos" || mailbox.domainName === domain,
  );
  const selected =
    visible.find((mailbox) => mailbox.id === selectedId) ?? visible[0] ?? null;

  async function run(action: string, extra?: { password?: string }) {
    if (!selected) return;
    setLoading(action);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/mailboxes/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mailboxId: selected.id, action, ...extra }),
    });
    const payload = (await response.json()) as { error?: string; password?: string };
    setLoading(null);
    if (!response.ok) {
      setError(payload.error || "Não foi possível atualizar a caixa.");
      return;
    }
    if (action === "reset-password") {
      setNotice(`Senha de ${selected.email} atualizada.`);
      setPassword("");
    } else if (action === "make-admin") {
      setNotice(`${selected.email} agora é o administrador de ${selected.domainName}.`);
    } else {
      setNotice("Atualizado.");
    }
    router.refresh();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <section className="wg-card overflow-hidden">
        <div className="border-b border-wg-border px-4 py-3">
          <label className="text-xs font-medium tracking-wide text-wg-text-muted uppercase">
            Domínio
          </label>
          <select
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            className="wg-input mt-2"
          >
            <option value="todos">Todos os domínios</option>
            {domains.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <ul className="max-h-[560px] overflow-y-auto">
          {visible.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-wg-text-muted">
              Nenhuma conta ativa.
            </li>
          ) : (
            visible.map((mailbox) => {
              const active = mailbox.id === selected?.id;
              return (
                <li key={mailbox.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(mailbox.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                      active ? "bg-wg-brand/[0.08]" : "hover:bg-wg-surface"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-wg-graphite">
                        {mailbox.email}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {mailbox.is_domain_admin ? (
                          <span className="text-[11px] font-semibold text-wg-brand">
                            Administrador
                          </span>
                        ) : (
                          <span className="text-[11px] text-wg-text-muted">
                            {mailbox.domainName}
                          </span>
                        )}
                      </span>
                    </span>
                    <StatusBadge status={primaryStatus(mailbox)} />
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <section className="wg-card p-6">
        {selected ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium tracking-wide text-wg-text-muted uppercase">
                  {selected.domainName}
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-wg-graphite">
                  {selected.email}
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge status={primaryStatus(selected)} />
                  {selected.mail_blocked ? (
                    <StatusBadge status="blocked" label="Caixa bloqueada" />
                  ) : null}
                  {selected.access_blocked ? (
                    <StatusBadge status="blocked" label="Acesso bloqueado" />
                  ) : null}
                  {selected.access_paused ? <StatusBadge status="paused" /> : null}
                  {selected.is_domain_admin ? (
                    <StatusBadge status="open" label="Admin do domínio" />
                  ) : null}
                </div>
              </div>
              <a href={webmailUrl} target="_blank" rel="noreferrer" className="wg-btn-secondary">
                Abrir webmail
              </a>
            </div>

            <div className="rounded-2xl bg-wg-surface px-4 py-3 text-sm text-wg-text-muted">
              <p className="flex items-start gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-wg-brand" />
                <span>
                  {selected.is_domain_admin
                    ? `Esta caixa é a administradora de ${selected.domainName}. É ela que altera as configurações exclusivas no webmail.`
                    : `O administrador de ${selected.domainName} é quem altera as configurações exclusivas no webmail.`}
                </span>
              </p>
              {selected.is_domain_admin ? null : (
                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={() => run("make-admin")}
                  className="mt-3 text-sm font-semibold text-wg-brand hover:underline disabled:opacity-50"
                >
                  {loading === "make-admin"
                    ? "Salvando..."
                    : "Tornar esta caixa o administrador do domínio"}
                </button>
              )}
            </div>

            {selected.status === "blocked" ? (
              <p className="rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
                A assinatura mantém esta caixa bloqueada. Pausar ou liberar aqui fica guardado e volta a valer quando a assinatura estiver em dia.
              </p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <ActionButton
                loading={loading === (selected.mail_blocked ? "unblock-mail" : "block-mail")}
                onClick={() =>
                  run(selected.mail_blocked ? "unblock-mail" : "block-mail")
                }
                label={selected.mail_blocked ? "Liberar caixa" : "Bloquear caixa"}
                hint="Para envio e recebimento"
              />
              <ActionButton
                loading={loading === (selected.access_blocked ? "unblock-access" : "block-access")}
                onClick={() =>
                  run(selected.access_blocked ? "unblock-access" : "block-access")
                }
                label={selected.access_blocked ? "Liberar acesso" : "Bloquear acesso"}
                hint="Impede o login no webmail"
              />
              <ActionButton
                loading={loading === (selected.access_paused ? "resume-access" : "pause-access")}
                onClick={() =>
                  run(selected.access_paused ? "resume-access" : "pause-access")
                }
                label={selected.access_paused ? "Retomar acesso" : "Pausar acesso"}
                hint="Pausa temporária do login"
              />
            </div>

            <form
              className="rounded-2xl border border-wg-border p-4"
              onSubmit={(event) => {
                event.preventDefault();
                run("reset-password", { password });
              }}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-wg-graphite">
                <KeyRound className="h-4 w-4 text-wg-brand" />
                Redefinir senha
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nova senha, mínimo de 8 caracteres"
                  className="wg-input"
                />
                <button type="submit" disabled={loading !== null} className="wg-btn disabled:opacity-50">
                  {loading === "reset-password" ? "Salvando..." : "Salvar senha"}
                </button>
              </div>
            </form>

            {error ? <p className="wg-alert-error">{error}</p> : null}
            {notice ? <p className="wg-alert-success">{notice}</p> : null}
          </div>
        ) : (
          <p className="text-sm text-wg-text-muted">
            Crie uma caixa em Caixas de entrada para gerenciar o acesso aqui.
          </p>
        )}
      </section>
    </div>
  );
}

function primaryStatus(mailbox: ActiveMailbox) {
  if (mailbox.status === "blocked") return "blocked";
  if (mailbox.access_paused) return "paused";
  if (mailbox.access_blocked || mailbox.mail_blocked) return "blocked";
  return "active";
}

function ActionButton({
  label,
  hint,
  loading,
  onClick,
}: {
  label: string;
  hint: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="rounded-2xl border border-wg-border px-4 py-3 text-left transition hover:border-wg-brand/40 disabled:opacity-50"
    >
      <span className="block text-sm font-semibold text-wg-graphite">
        {loading ? "Salvando..." : label}
      </span>
      <span className="mt-0.5 block text-xs text-wg-text-muted">{hint}</span>
    </button>
  );
}
