import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/section-placeholder";

export const metadata: Metadata = {
  title: "Suporte",
};

export default function SuportePage() {
  return (
    <SectionPlaceholder
      title="Suporte"
      description="Atendimento e solicitações da sua conta WebGeele."
      bullets={[
        "Abrir novos chamados de suporte",
        "Acompanhar status e respostas da equipe",
        "Consultar histórico de atendimentos",
      ]}
    />
  );
}
