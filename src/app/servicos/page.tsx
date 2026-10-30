import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/section-placeholder";

export const metadata: Metadata = {
  title: "Meus serviços",
};

export default function ServicosPage() {
  return (
    <SectionPlaceholder
      title="Meus serviços"
      description="Serviços contratados na WebGeele e status de cada um."
      bullets={[
        "Listar serviços ativos, suspensos e em provisionamento",
        "Abrir detalhes de cada serviço contratado",
        "Acompanhar datas de renovação e status operacional",
      ]}
    />
  );
}
