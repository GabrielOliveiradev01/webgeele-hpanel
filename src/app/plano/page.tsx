import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/section-placeholder";

export const metadata: Metadata = {
  title: "Plano e consumo",
};

export default function PlanoPage() {
  return (
    <SectionPlaceholder
      title="Plano e consumo"
      description="Plano contratado e utilização dos recursos da conta."
      bullets={[
        "Visualizar plano atual e benefícios inclusos",
        "Acompanhar consumo e limites disponíveis",
        "Solicitar upgrade ou ajuste de plano",
      ]}
    />
  );
}
