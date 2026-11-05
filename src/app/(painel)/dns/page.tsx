import { redirect } from "next/navigation";

// O gerenciador de DNS está fora do ar até termos um servidor de DNS próprio.
// Os registros de e-mail de cada domínio ficam em Domínios → Ver DNS.
export default function DnsPage() {
  redirect("/dominios");
}
