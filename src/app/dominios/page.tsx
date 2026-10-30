import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/section-placeholder";

export const metadata: Metadata = {
  title: "Domínios",
};

export default function DominiosPage() {
  return (
    <SectionPlaceholder
      title="Domínios"
      description="Domínios registrados e ferramentas de gerenciamento."
      bullets={[
        "Listar domínios da conta e datas de expiração",
        "Gerenciar contatos e renovação automática",
        "Acessar ações de transferência e configuração",
      ]}
    />
  );
}
