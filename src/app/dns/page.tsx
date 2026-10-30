import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/section-placeholder";

export const metadata: Metadata = {
  title: "DNS",
};

export default function DnsPage() {
  return (
    <SectionPlaceholder
      title="DNS"
      description="Gerenciamento de configurações e registros DNS."
      bullets={[
        "Editar registros A, AAAA, CNAME, MX e TXT",
        "Aplicar alterações por domínio contratado",
        "Consultar histórico recente de mudanças",
      ]}
    />
  );
}
