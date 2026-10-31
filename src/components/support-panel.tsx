"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
};

export function SupportPanel({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message, priority }),
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(payload.error || "Falha ao abrir chamado");
      return;
    }
    setSubject("");
    setMessage("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-3 wg-card p-6">
        <h2 className="font-display text-lg font-semibold text-wg-graphite">Novo chamado</h2>
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Assunto"
          className="w-full wg-input"
        />
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Descreva sua solicitação"
          className="w-full wg-input"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="wg-input"
        >
          <option value="low">Baixa</option>
          <option value="normal">Normal</option>
          <option value="high">Alta</option>
        </select>
        {error ? <p className="wg-alert-error">{error}</p> : null}
        <button
          disabled={loading}
          className="wg-btn disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Abrir chamado"}
        </button>
      </form>

      <div className="overflow-hidden wg-card">
        <table className="w-full text-left text-sm">
          <thead className="wg-table-head">
            <tr>
              <th className="px-4 py-3">Assunto</th>
              <th className="px-4 py-3">Prioridade</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-wg-text-muted">
                  Nenhum chamado ainda.
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-wg-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-wg-graphite">{ticket.subject}</p>
                    <p className="text-wg-text-muted">{ticket.message}</p>
                  </td>
                  <td className="px-4 py-3">{ticket.priority}</td>
                  <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                  <td className="px-4 py-3">
                    {new Date(ticket.created_at).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
