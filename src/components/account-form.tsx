"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AccountForm({
  account,
}: {
  account: {
    legal_name: string | null;
    trade_name: string | null;
    email: string;
    document: string | null;
    phone: string | null;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    legal_name: account.legal_name || "",
    trade_name: account.trade_name || "",
    email: account.email || "",
    document: account.document || "",
    phone: account.phone || "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(payload.error || "Falha ao salvar");
      return;
    }
    setMessage("Dados atualizados.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-2xl border border-wg-border bg-white p-6">
      {[
        ["legal_name", "Nome / Razão social"],
        ["trade_name", "Nome fantasia"],
        ["email", "E-mail"],
        ["document", "CPF/CNPJ"],
        ["phone", "Telefone"],
      ].map(([key, label]) => (
        <label key={key} className="block space-y-1.5">
          <span className="text-sm font-medium text-wg-graphite">{label}</span>
          <input
            value={form[key as keyof typeof form]}
            onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
            className="w-full rounded-xl border border-wg-border bg-wg-surface px-3 py-2.5 text-sm"
          />
        </label>
      ))}
      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {message ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
      ) : null}
      <button
        disabled={loading}
        className="rounded-xl bg-wg-graphite px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Salvar conta"}
      </button>
    </form>
  );
}
