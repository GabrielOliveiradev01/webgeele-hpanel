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

/**
 * Pedidos que alteram estado têm de vir do próprio painel (proteção CSRF):
 * o Origin enviado pelo navegador tem de corresponder ao host deste pedido.
 * No Netlify, `request.url` não traz o domínio público, por isso usamos os
 * cabeçalhos Host / X-Forwarded-Host (um site de terceiros não os controla).
 */
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  let originHost: string;
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") return false;
    originHost = parsed.host;
  } catch {
    return false;
  }

  const hosts = new Set<string>();
  for (const header of ["x-forwarded-host", "host"]) {
    const value = request.headers.get(header)?.split(",")[0]?.trim();
    if (value) hosts.add(value.toLowerCase());
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    hosts.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).host.toLowerCase());
  }
  return hosts.has(originHost.toLowerCase());
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
