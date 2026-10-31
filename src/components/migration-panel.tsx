"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { MigrationView } from "@/lib/transfer/service";
import { StatusBadge } from "@/components/status-badge";

type Provider = { id: string; label: string; hint: string };
type Mailbox = { id: string; email: string };

const POLL_MS = 3_000;

const STATUS_LABEL: Record<MigrationView["status"], string> = {
  pending: "Na fila",
  running: "Em andamento",
  completed: "Concluída",
  failed: "Falhou",
};

const PHASE_LABEL: Record<string, string> = {
  starting: "Conectando aos servidores",
  scanning: "Analisando pastas",
  syncing: "Copiando mensagens",
  finishing: "Finalizando",
  done: "Finalizada",
  failed: "Interrompida",
};

const isActive = (m: MigrationView) => m.status === "pending" || m.status === "running";
const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
const formatNumber = (value: number | null) => (value === null ? "—" : value.toLocaleString("pt-BR"));

const inputClass =
  "wg-input disabled:opacity-50";

export function MigrationPanel({
  providers,
  mailboxes,
  initialMigrations,
  loadError,
}: {
  providers: Provider[];
  mailboxes: Mailbox[];
  initialMigrations: MigrationView[];
  loadError: string | null;
}) {
  const [provider, setProvider] = useState(providers[0]?.id ?? "");
  const [sourceEmail, setSourceEmail] = useState("");
  // As senhas só existem neste estado em memória: não vão para localStorage,
  // sessionStorage, cookies nem URL, e são limpas ao iniciar a cópia.
  const [sourcePassword, setSourcePassword] = useState("");
  const [mailboxId, setMailboxId] = useState(mailboxes[0]?.id ?? "");
  const [destinationPassword, setDestinationPassword] = useState("");
  const [migrations, setMigrations] = useState(initialMigrations);
  const [currentId, setCurrentId] = useState<string | null>(
    initialMigrations.find(isActive)?.id ?? null,
  );
  const [busy, setBusy] = useState<"check" | "sync" | null>(null);
  const [error, setError] = useState<string | null>(loadError);
  const [notice, setNotice] = useState<string | null>(null);

  const current = migrations.find((m) => m.id === currentId) ?? null;
  const selectedProvider = providers.find((p) => p.id === provider);
  const selectedMailbox = mailboxes.find((m) => m.id === mailboxId);

  const upsert = useCallback((migration: MigrationView) => {
    setMigrations((list) => [migration, ...list.filter((m) => m.id !== migration.id)].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    ));
  }, []);

  // Acompanha a migração selecionada enquanto estiver ativa.
  useEffect(() => {
    if (!current || !isActive(current)) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/migrations/${current.id}`, { cache: "no-store" });
        const payload = await response.json();
        if (!cancelled && response.ok) upsert(payload.migration);
      } catch {
        // Falha de rede temporária: tenta de novo no próximo ciclo.
        if (!cancelled) upsert({ ...current });
      }
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [current, upsert]);

  // A cópia só é liberada com um teste bem-sucedido para exatamente estes dados.
  const verified = useMemo(() => {
    if (!current || current.kind !== "check" || current.status !== "completed") return false;
    return (
      current.provider === provider &&
      current.sourceEmail === sourceEmail.trim().toLowerCase() &&
      current.mailboxId === mailboxId
    );
  }, [current, provider, sourceEmail, mailboxId]);

  const formReady = Boolean(provider && sourceEmail && sourcePassword && mailboxId && destinationPassword);
  const anyActiveSync = migrations.some((m) => m.kind === "sync" && isActive(m) && m.mailboxId === mailboxId);

  async function submit(kind: "check" | "sync") {
    setBusy(kind);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/migrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, provider, sourceEmail, sourcePassword, mailboxId, destinationPassword }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Não foi possível iniciar.");
        if (payload.migrationId) setCurrentId(payload.migrationId);
        return;
      }
      upsert(payload.migration);
      setCurrentId(payload.migration.id);
      if (kind === "sync") {
        setSourcePassword("");
        setDestinationPassword("");
        setNotice("Migração iniciada. Pode fechar esta página: ela continua no servidor.");
      }
    } catch {
      setError("Sem conexão com o painel. Verifique a internet e tente novamente.");
    } finally {
      setBusy(null);
    }
  }

  function onCheck(event: FormEvent) {
    event.preventDefault();
    submit("check");
  }

  function prepareResync(migration: MigrationView) {
    setProvider(migration.provider);
    setSourceEmail(migration.sourceEmail);
    if (migration.mailboxId && mailboxes.some((m) => m.id === migration.mailboxId)) {
      setMailboxId(migration.mailboxId);
    }
    setSourcePassword("");
    setDestinationPassword("");
    setCurrentId(null);
    setError(null);
    setNotice("Digite as duas senhas e teste a conexão para copiar as mensagens novas. As já copiadas não serão duplicadas.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (mailboxes.length === 0) {
    return (
      <div className="wg-card p-6">
        <h2 className="font-display text-lg font-semibold text-wg-graphite">Nenhuma caixa ativa</h2>
        <p className="mt-2 text-sm text-wg-text-muted">
          Crie primeiro a caixa de destino em <Link href="/caixas" className="font-medium text-wg-brand underline">Caixas de entrada</Link>.
          Depois volte aqui para copiar as mensagens da conta antiga.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onCheck} className="wg-card p-5" autoComplete="off">
        <div className="grid gap-6 md:grid-cols-2">
          <fieldset className="space-y-3">
            <legend className="font-display text-lg font-semibold text-wg-graphite">1. Conta de origem</legend>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-wg-text-muted">Provedor</span>
              <select value={provider} onChange={(e) => setProvider(e.target.value)} className={inputClass} disabled={!!busy}>
                {providers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            {selectedProvider ? <p className="text-xs text-wg-text-muted">{selectedProvider.hint}</p> : null}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-wg-text-muted">E-mail</span>
              <input
                type="email"
                required
                value={sourceEmail}
                onChange={(e) => setSourceEmail(e.target.value)}
                placeholder="voce@empresa.com.br"
                autoComplete="off"
                className={inputClass}
                disabled={!!busy}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-wg-text-muted">Senha</span>
              <input
                type="password"
                required
                value={sourcePassword}
                onChange={(e) => setSourcePassword(e.target.value)}
                autoComplete="off"
                className={inputClass}
                disabled={!!busy}
              />
            </label>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="font-display text-lg font-semibold text-wg-graphite">2. Caixa WebGeele</legend>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-wg-text-muted">Caixa de destino</span>
              <select value={mailboxId} onChange={(e) => setMailboxId(e.target.value)} className={inputClass} disabled={!!busy}>
                {mailboxes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-wg-text-muted">
                Senha de {selectedMailbox?.email ?? "caixa WebGeele"}
              </span>
              <input
                type="password"
                required
                value={destinationPassword}
                onChange={(e) => setDestinationPassword(e.target.value)}
                autoComplete="off"
                className={inputClass}
                disabled={!!busy}
              />
            </label>
            <p className="text-xs text-wg-text-muted">
              As senhas são usadas só para esta migração e não ficam guardadas.
            </p>
          </fieldset>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-wg-border/70 pt-5">
          <button
            type="submit"
            disabled={!formReady || !!busy}
            className="wg-btn-secondary"
          >
            {busy === "check" ? "Enviando…" : "Testar conexão"}
          </button>
          <button
            type="button"
            onClick={() => submit("sync")}
            disabled={!verified || !formReady || !!busy || anyActiveSync}
            className="wg-btn"
          >
            {busy === "sync" ? "Iniciando…" : "Iniciar migração"}
          </button>
          <p className="text-xs text-wg-text-muted">
            {anyActiveSync
              ? "Já existe uma migração em andamento para esta caixa."
              : verified
                ? "Conexão verificada. A migração copia as mensagens sem alterar a conta de origem."
                : "Teste a conexão para liberar a migração."}
          </p>
        </div>
      </form>

      {error ? <p role="alert" className="wg-alert-error">{error}</p> : null}
      {notice ? <p className="rounded-xl border border-wg-brand/15 bg-wg-brand/[0.06] px-3.5 py-2.5 text-sm text-wg-brand-dark">{notice}</p> : null}

      {current ? <MigrationDetails migration={current} /> : null}

      <div className="wg-card p-5">
        <h2 className="font-display text-lg font-semibold text-wg-graphite">Histórico</h2>
        {migrations.length === 0 ? (
          <p className="mt-2 text-sm text-wg-text-muted">Nenhuma migração ainda.</p>
        ) : (
          <div className="-mx-5 mt-4 overflow-x-auto border-t border-wg-border/70">
            <table className="w-full text-left text-sm">
              <thead className="wg-table-head">
                <tr>
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Origem → destino</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Copiadas</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-wg-border/70">
                {migrations.map((m) => (
                  <tr key={m.id} className={m.id === currentId ? "bg-wg-brand/[0.04]" : undefined}>
                    <td className="px-5 py-3 whitespace-nowrap text-wg-text-muted">{formatDate(m.createdAt)}</td>
                    <td className="px-5 py-3">{m.kind === "check" ? "Teste" : "Migração"}</td>
                    <td className="px-5 py-3">
                      <span className="block truncate">{m.sourceEmail}</span>
                      <span className="block truncate text-xs text-wg-text-muted">→ {m.destinationEmail}</span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={m.status} label={STATUS_LABEL[m.status]} />
                    </td>
                    <td className="px-5 py-3">{m.kind === "sync" ? formatNumber(m.progress.copied) : "—"}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <button type="button" onClick={() => setCurrentId(m.id)} className="text-xs font-medium text-wg-brand">
                        Detalhes
                      </button>
                      {m.kind === "sync" && !isActive(m) ? (
                        <button
                          type="button"
                          onClick={() => prepareResync(m)}
                          className="ml-3 text-xs font-medium text-wg-graphite hover:text-wg-brand"
                        >
                          Sincronizar novamente
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MigrationDetails({ migration: m }: { migration: MigrationView }) {
  const p = m.progress;
  const title = m.kind === "check" ? "Teste de conexão" : "Migração";
  const phase = p.phase ? (PHASE_LABEL[p.phase] ?? p.phase) : null;

  return (
    <div className="wg-card p-5" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-wg-graphite">{title}</h2>
          <p className="mt-1 text-sm text-wg-text-muted">
            {m.sourceEmail} → {m.destinationEmail}
          </p>
        </div>
        <StatusBadge
          status={m.status}
          label={`${STATUS_LABEL[m.status]}${isActive(m) && phase ? ` · ${phase}` : ""}`}
        />
      </div>

      {m.kind === "check" && m.status === "completed" ? (
        <p className="mt-4 wg-alert-success">
          Login confirmado nas duas contas. Você já pode iniciar a migração.
        </p>
      ) : null}

      {m.kind === "sync" ? (
        <>
          {p.percent !== null ? (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-wg-text-muted">
                <span>
                  {formatNumber(p.processed)} de {formatNumber(p.total)} mensagens analisadas
                </span>
                <span>{p.percent.toLocaleString("pt-BR")}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-wg-surface">
                <div className="h-full rounded-full bg-wg-brand transition-all" style={{ width: `${Math.min(100, p.percent)}%` }} />
              </div>
            </div>
          ) : isActive(m) ? (
            <p className="mt-4 text-sm text-wg-text-muted">Calculando o tamanho das pastas…</p>
          ) : null}

          <dl className="mt-5 grid gap-3 sm:grid-cols-4">
            <Stat label="Pastas" value={p.foldersTotal !== null ? `${formatNumber(p.foldersDone)} / ${formatNumber(p.foldersTotal)}` : "—"} />
            <Stat label="Copiadas" value={formatNumber(p.copied)} />
            <Stat label="Já existiam" value={formatNumber(p.skipped)} />
            <Stat label="Erros" value={formatNumber(p.errors)} />
          </dl>
          {isActive(m) && p.currentFolder ? (
            <p className="mt-3 text-xs text-wg-text-muted">Pasta atual: {p.currentFolder}</p>
          ) : null}
        </>
      ) : null}

      {m.error ? <p className="mt-4 wg-alert-error">{m.error.message}</p> : null}

      <p className="mt-4 text-xs text-wg-text-muted">
        Iniciada {formatDate(m.startedAt ?? m.createdAt)}
        {m.finishedAt ? ` · terminada ${formatDate(m.finishedAt)}` : ""}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="wg-stat">
      <dt className="text-xs text-wg-text-muted">{label}</dt>
      <dd className="mt-0.5 font-display text-lg font-semibold text-wg-graphite">{value}</dd>
    </div>
  );
}
