import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.DEMO_USER_EMAIL || "cliente@webgeele.com.br";
const password = process.env.DEMO_USER_PASSWORD || "WebGeele@2026";

if (!url || !service) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: listed } = await admin.auth.admin.listUsers({ perPage: 200 });
let user = listed?.users?.find((item) => item.email === email);

if (!user) {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error) {
    console.error(created.error);
    process.exit(1);
  }
  user = created.data.user;
  console.log("created auth user", user.id);
} else {
  console.log("auth user exists", user.id);
}

const { data: plan } = await admin
  .from("plans")
  .select("id, code")
  .eq("code", "business")
  .single();

const { data: account, error: accountError } = await admin
  .from("accounts")
  .upsert(
    {
      owner_user_id: user.id,
      email,
      legal_name: "Cliente Demo WebGeele",
      trade_name: "WebGeele Demo",
      status: "active",
    },
    { onConflict: "owner_user_id" },
  )
  .select("*")
  .single();

if (accountError) {
  console.error(accountError);
  process.exit(1);
}

const { data: existingSub } = await admin
  .from("subscriptions")
  .select("id")
  .eq("account_id", account.id)
  .maybeSingle();

if (!existingSub) {
  await admin.from("subscriptions").insert({
    account_id: account.id,
    plan_id: plan.id,
    status: "active",
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
  });
}

console.log({
  email,
  password,
  accountId: account.id,
  plan: plan.code,
});
