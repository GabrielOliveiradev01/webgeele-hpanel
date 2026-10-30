import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/section-placeholder";

export const metadata: Metadata = {
  title: "Minha conta",
};

export default function ContaPage() {
  return (
    <SectionPlaceholder
      title="Minha conta"
      description="Dados cadastrais e segurança do acesso ao painel."
      bullets={[
        "Atualizar dados pessoais e de contato",
        "Gerenciar senha, sessão e autenticação",
        "Definir preferências de comunicação",
      ]}
    />
  );
}
