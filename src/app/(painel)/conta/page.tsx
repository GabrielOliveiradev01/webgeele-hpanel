import type { Metadata } from "next";
import { requireAccount } from "@/lib/auth/account";
import { PageHeader } from "@/components/page-header";
import { AccountForm } from "@/components/account-form";

export const metadata: Metadata = { title: "Minha conta" };

export default async function ContaPage() {
  const { account } = await requireAccount();

  return (
    <div>
      <PageHeader
        title="Minha conta"
        description="Dados cadastrais da conta (1 usuário por painel)."
      />
      {account ? (
        <AccountForm account={account} />
      ) : (
        <p className="text-sm text-wg-text-muted">Conta ainda não provisionada.</p>
      )}
    </div>
  );
}
