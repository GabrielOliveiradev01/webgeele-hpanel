import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export async function ensureAccountForUser(user: User) {
  const admin = createAdminClient();
  const email = user.email;
  if (!email) return null;

  const legalName =
    (user.user_metadata?.legal_name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    email.split("@")[0];

  const { data: existing, error: existingError } = await admin
    .from("accounts")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const { data: account, error } = await admin
    .from("accounts")
    .insert({
      owner_user_id: user.id,
      email,
      legal_name: legalName,
      trade_name: legalName,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: again } = await admin
        .from("accounts")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();
      return again;
    }
    throw error;
  }

  return account;
}
