import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/section-placeholder";

export const metadata: Metadata = {
  title: "Diretório de empresas",
};

export default function DiretorioPage() {
  return (
    <SectionPlaceholder
      title="Diretório de empresas"
      description="Módulo próprio de listagem e descoberta de empresas, sem vínculo operacional com o WebGeele Mail."
      bullets={[
        "Publicar e gerenciar a presença no diretório",
        "Controlar visibilidade e categorias",
        "Manter o módulo separado da gestão de serviços e do correio",
      ]}
    />
  );
}
