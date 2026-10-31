"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BuyMailboxModal } from "@/components/buy-mailbox-modal";
type Mailbox = {
  id: string;
  email: string;
  status: string;
  blocked_reason: string | null;
  quota_mb: number | null;
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

export function MailboxesPanel({
  mailboxes,
  entitlement,
  domains,
  webmailUrl,
}: {
  mailboxes: Mailbox[];
  entitlement: Entitlement;
  domains: string[];
  webmailUrl: string;
}) {
  const router = useRouter();
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
          <p className="mt-1 text-xs text-wg-text-muted">Caixas contratadas no Assas</p>
        </div>
        <div className="wg-card p-5 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-wg-text-muted uppercase">
            Armazenamento
          </p>
          <p className="mt-2 font-display text-2xl font-semibold text-wg-graphite">
            {storageUsed} / {storageMax} MB
          </p>
          <p className="mt-1 text-xs text-wg-text-muted">
            Start 2GB · Business 5GB · Pro 15GB
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
            Sem caixas grátis. Contrate no Assas (mensal ou anual) e depois crie os e-mails.
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

      <div className="wg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-wg-graphite">
              Criar caixa de e-mail
            </h2>
            <p className="mt-1 text-sm text-wg-text-muted">
              Usa somente a cota das assinaturas Assas.
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

      <div className="overflow-hidden wg-card">
        <table className="w-full text-left text-sm">
          <thead className="wg-table-head">
            <tr>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Armazenamento</th>
            </tr>
          </thead>
          <tbody>
            {mailboxes.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-wg-text-muted">
                  Nenhuma caixa ainda.
                </td>
              </tr>
            ) : (
              mailboxes.map((mailbox) => (
                <tr key={mailbox.id} className="border-b border-wg-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-wg-graphite">{mailbox.email}</td>
                  <td className="px-4 py-3">Ativo</td>
                  <td className="px-4 py-3">
                    {mailbox.quota_mb
                      ? `${(mailbox.quota_mb / 1024).toFixed(0)} GB`
                      : "—"}
                  </td>
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
