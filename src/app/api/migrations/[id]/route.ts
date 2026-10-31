import type { NextRequest } from "next/server";
import { errorResponse, getOwnedAccount, json } from "@/lib/transfer/http";
import { getMigration } from "@/lib/transfer/service";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/migrations/[id]">) {
  const owned = await getOwnedAccount();
  if (owned.error) return owned.error;

  const { id } = await ctx.params;
  try {
    // Filtra pela conta da sessão: migrações de outro cliente respondem 404.
    const migration = await getMigration(owned.accountId, id);
    if (!migration) return json({ error: "Migração não encontrada" }, 404);
    return json({ migration });
  } catch (error) {
    return errorResponse(error);
  }
}
