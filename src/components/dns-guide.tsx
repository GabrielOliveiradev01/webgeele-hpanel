"use client";

import { useMemo, useState } from "react";
import { Check, CheckCircle2, CircleAlert, CircleDashed, Copy, RefreshCw } from "lucide-react";
import {
  LEVELS,
  dnsGuide,
  type DnsGuideRow,
  type DnsLevel,
  type DnsRecordInput,
} from "@/lib/domains/dns-priority";

type CheckResult = "ok" | "missing" | "wrong";

const RESULT_LABEL: Record<CheckResult, { label: string; className: string; icon: typeof Check }> = {
  ok: { label: "Configurado", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/15", icon: CheckCircle2 },
  wrong: { label: "Valor diferente", className: "bg-amber-50 text-amber-700 ring-amber-600/15", icon: CircleAlert },
  missing: { label: "Não encontrado", className: "bg-red-50 text-red-700 ring-red-600/15", icon: CircleDashed },
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      aria-label="Copiar"
      className="shrink-0 rounded-lg p-1.5 text-wg-text-muted transition hover:bg-wg-surface hover:text-wg-brand"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function Field({ label, value, mono, copy }: { label: string; value: string; mono?: boolean; copy?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold tracking-wide text-wg-text-muted uppercase">{label}</p>
      <div className="mt-1 flex items-start gap-1 rounded-lg border border-wg-border bg-wg-surface/60 px-2.5 py-1.5">
        <span className={`min-w-0 flex-1 break-all text-sm text-wg-graphite ${mono ? "font-mono text-xs leading-5" : ""}`}>
          {value}
        </span>
        {copy ? <CopyButton value={value} /> : null}
      </div>
    </div>
  );
}

function RecordCard({ row, step, result }: { row: DnsGuideRow; step?: number; result?: CheckResult }) {
  const status = result ? RESULT_LABEL[result] : null;
  return (
    <div className="rounded-xl border border-wg-border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          {step ? (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-wg-brand text-xs font-semibold text-white">
              {step}
            </span>
          ) : null}
          <div>
            <p className="text-sm font-semibold text-wg-graphite">{row.title}</p>
            <p className="mt-0.5 text-xs text-wg-text-muted">{row.help}</p>
          </div>
        </div>
        {status ? (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${status.className}`}>
            <status.icon className="h-3.5 w-3.5" />
            {status.label}
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[90px_minmax(0,1fr)] md:grid-cols-[90px_minmax(0,180px)_minmax(0,1fr)_90px]">
        <Field label="Tipo" value={row.type} />
        <Field label="Nome / Host" value={row.name} mono copy />
        {row.srv ? (
          <Field label="Destino" value={row.srv.target} mono copy />
        ) : (
          <Field label="Valor" value={row.value} mono copy />
        )}
        {row.type === "MX" ? (
          <Field label="Prioridade" value={String(row.priority ?? 10)} />
        ) : row.srv ? (
          <Field label="Porta" value={row.srv.port} />
        ) : (
          <Field label="TTL" value={String(row.ttl || 3600)} />
        )}
      </div>
      {row.srv ? (
        <p className="mt-2 text-xs text-wg-text-muted">
          Prioridade {row.srv.priority} · Peso {row.srv.weight} · Porta {row.srv.port} · TTL {row.ttl || 3600}
        </p>
      ) : null}
    </div>
  );
}

export function DnsGuide({
  domain,
  domainId,
  records,
  onStatusChange,
}: {
  domain: string;
  domainId?: string;
  records: DnsRecordInput[];
  onStatusChange?: (status: string) => void;
}) {
  const rows = useMemo(() => dnsGuide(records, domain), [records, domain]);
  const [results, setResults] = useState<Record<string, CheckResult>>({});
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "warn" | "error"; text: string } | null>(null);

  async function verify() {
    if (!domainId) return;
    setChecking(true);
    setMessage(null);
    try {
      const response = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check_dns", domainId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ tone: "error", text: payload.error || "Não foi possível verificar agora." });
        return;
      }
      setResults(payload.results ?? {});
      onStatusChange?.(payload.status);
      setMessage(
        payload.ready
          ? { tone: "ok", text: "Tudo certo! Os registros obrigatórios estão configurados e o domínio está ativo." }
          : {
              tone: "warn",
              text: "Ainda faltam registros obrigatórios. Depois de salvar no provedor, a propagação pode levar de alguns minutos a algumas horas.",
            },
      );
    } catch {
      setMessage({ tone: "error", text: "Sem conexão com o painel. Tente novamente." });
    } finally {
      setChecking(false);
    }
  }

  const byLevel = (level: DnsLevel) => rows.filter((row) => row.level === level);
  let step = 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-xl text-sm text-wg-text-muted">
          Cadastre estes registros no provedor onde o domínio está (Registro.br, Hostinger, GoDaddy,
          Cloudflare…). Em <strong className="text-wg-graphite">Nome</strong>, use @ para o domínio
          principal. Se o provedor pedir o nome completo, acrescente <span className="font-mono">.{domain}</span>.
        </p>
        {domainId ? (
          <button type="button" onClick={verify} disabled={checking} className="wg-btn px-3.5 py-2">
            <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Verificando..." : "Verificar DNS"}
          </button>
        ) : null}
      </div>

      {message ? (
        <p
          className={
            message.tone === "ok"
              ? "wg-alert-success"
              : message.tone === "error"
                ? "wg-alert-error"
                : "rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800"
          }
        >
          {message.text}
        </p>
      ) : null}

      {(["required", "recommended"] as const).map((level) =>
        byLevel(level).length ? (
          <section key={level}>
            <h3 className="font-display text-sm font-semibold text-wg-graphite">
              {LEVELS[level].label}
              <span className="ml-2 font-sans text-xs font-normal text-wg-text-muted">
                {LEVELS[level].description}
              </span>
            </h3>
            <div className="mt-3 space-y-3">
              {byLevel(level).map((row) => (
                <RecordCard key={row.key} row={row} step={++step} result={results[row.key]} />
              ))}
            </div>
          </section>
        ) : null,
      )}

      {byLevel("optional").length ? (
        <details className="group rounded-xl border border-dashed border-wg-border p-4">
          <summary className="cursor-pointer text-sm font-semibold text-wg-graphite">
            {LEVELS.optional.label} ({byLevel("optional").length})
            <span className="ml-2 text-xs font-normal text-wg-text-muted">{LEVELS.optional.description}</span>
          </summary>
          <div className="mt-3 space-y-3">
            {byLevel("optional").map((row) => (
              <RecordCard key={row.key} row={row} />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
