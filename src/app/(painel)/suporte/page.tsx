import type { Metadata } from "next";
import { requireAccount } from "@/lib/auth/account";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/page-header";
import { SupportPanel } from "@/components/support-panel";

export const metadata: Metadata = { title: "Suporte" };

export default async function SuportePage() {
  const { account } = await requireAccount();
  let tickets: Array<{
    id: string;
    subject: string;
    message: string;
    status: string;
    priority: string;
    created_at: string;
  }> = [];

  if (account) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("support_tickets")
      .select("*")
      .eq("account_id", account.id)
      .order("created_at", { ascending: false });
    tickets = data ?? [];
  }

  return (
    <div>
      <PageHeader
        title="Suporte"
        description="Abra e acompanhe solicitações de atendimento."
      />
      <SupportPanel tickets={tickets} />
    </div>
  );
}
