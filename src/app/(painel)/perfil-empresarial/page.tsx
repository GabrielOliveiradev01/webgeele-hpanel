import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/section-placeholder";

export const metadata: Metadata = {
  title: "Perfil empresarial",
};

export default function PerfilEmpresarialPage() {
  return (
    <SectionPlaceholder
      title="Perfil empresarial"
      description="Módulo próprio para dados e presença da empresa — separado do webmail e da gestão de serviços."
      bullets={[
        "Manter informações institucionais da empresa",
        "Organizar identidade e dados públicos do negócio",
        "Preparar informações usadas pelo diretório",
      ]}
    />
  );
}
