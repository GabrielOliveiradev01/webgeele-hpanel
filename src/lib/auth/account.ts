import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requireAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, account: null, error: "unauthenticated" as const };
  }

  const admin = createAdminClient();
  const { data: account, error } = await admin
    .from("accounts")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (account) {
    const { count } = await admin
      .from("mailboxes")
      .select("*", { count: "exact", head: true })
      .eq("account_id", account.id)
      .eq("status", "blocked");

    if ((count ?? 0) > 0 && account.status === "active") {
      await admin
        .from("mailboxes")
        .update({ status: "active", blocked_reason: null })
        .eq("account_id", account.id)
        .eq("status", "blocked");
    }
  }

  return { user, account, error: account ? null : ("no_account" as const) };
}
