const statusMap: Record<string, { label: string; tone: keyof typeof tones }> = {
  active: { label: "Ativo", tone: "success" },
  ativo: { label: "Ativo", tone: "success" },
  confirmed: { label: "Confirmado", tone: "success" },
  received: { label: "Recebido", tone: "success" },
  paid: { label: "Pago", tone: "success" },
  verified: { label: "Verificado", tone: "success" },
  resolved: { label: "Resolvido", tone: "success" },
  closed: { label: "Fechado", tone: "neutral" },
  pending: { label: "Pendente", tone: "warning" },
  running: { label: "Em andamento", tone: "brand" },
  completed: { label: "Concluído", tone: "success" },
  open: { label: "Aberto", tone: "brand" },
  answered: { label: "Respondido", tone: "brand" },
  overdue: { label: "Vencido", tone: "danger" },
  failed: { label: "Falhou", tone: "danger" },
  canceled: { label: "Cancelado", tone: "neutral" },
  cancelled: { label: "Cancelado", tone: "neutral" },
  inactive: { label: "Inativo", tone: "neutral" },
  suspended: { label: "Suspenso", tone: "danger" },
};

const tones = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/15",
  danger: "bg-red-50 text-red-700 ring-red-600/15",
  brand: "bg-wg-brand/[0.08] text-wg-brand ring-wg-brand/15",
  neutral: "bg-wg-surface text-wg-text-muted ring-wg-border",
};

const dots = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  brand: "bg-wg-brand",
  neutral: "bg-wg-text-muted/50",
};

export function StatusBadge({
  status,
  label,
}: {
  status: string | null | undefined;
  label?: string;
}) {
  if (!status || status === "—") {
    return <span className="text-wg-text-muted">—</span>;
  }
  const entry = statusMap[status.toLowerCase()];
  const tone = entry?.tone ?? "neutral";

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[tone]}`} />
      {label ?? entry?.label ?? status}
    </span>
  );
}
