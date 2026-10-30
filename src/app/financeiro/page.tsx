import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/section-placeholder";

export const metadata: Metadata = {
  title: "Financeiro",
};

export default function FinanceiroPage() {
  return (
    <SectionPlaceholder
      title="Financeiro"
      description="Faturas, pagamentos e histórico financeiro da conta."
      bullets={[
        "Consultar faturas abertas e pagas",
        "Baixar boletos e comprovantes",
        "Acompanhar métodos de pagamento e histórico",
      ]}
    />
  );
}
