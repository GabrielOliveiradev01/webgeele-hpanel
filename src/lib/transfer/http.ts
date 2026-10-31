import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MigrationError } from "@/lib/transfer/service";

const NO_STORE = { "Cache-Control": "no-store" };

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

/** Sessão Supabase → conta do cliente. Toda a consulta é filtrada por esta conta. */
export async function getOwnedAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: json({ error: "Não autenticado" }, 401) };

  const { data: account } = await createAdminClient()
    .from("accounts")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!account) return { error: json({ error: "Conta não encontrada" }, 404) };

  return { userId: user.id, accountId: account.id as string };
}

/** Pedidos que alteram estado têm de vir do próprio painel (proteção CSRF). */
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const allowed = new Set([new URL(request.url).origin]);
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    allowed.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).origin);
  }
  return allowed.has(origin);
}

export function errorResponse(error: unknown) {
  if (error instanceof MigrationError) {
    return json(
      { error: error.message, ...(error.migrationId ? { migrationId: error.migrationId } : {}) },
      error.status,
    );
  }
  // Nunca devolve detalhes internos (podem conter configuração ou dados do pedido).
  console.error("[migrations] erro inesperado", error instanceof Error ? error.message : error);
  return json({ error: "Não foi possível processar a migração." }, 500);
}
