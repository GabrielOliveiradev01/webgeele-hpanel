import { errorResponse, getOwnedAccount, json, sameOrigin } from "@/lib/transfer/http";
import { listMigrations, startMigration } from "@/lib/transfer/service";

const MAX_BODY_BYTES = 8_000;

export async function GET() {
  const owned = await getOwnedAccount();
  if (owned.error) return owned.error;

  try {
    return json({ migrations: await listMigrations(owned.accountId) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Origem não permitida" }, 403);

  const owned = await getOwnedAccount();
  if (owned.error) return owned.error;

  // O corpo contém as senhas: é lido, validado e repassado ao Worker, nunca registado.
  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return json({ error: "Dados muito grandes" }, 413);
    body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
  } catch {
    return json({ error: "Pedido inválido" }, 400);
  }

  try {
    const migration = await startMigration({
      accountId: owned.accountId,
      userId: owned.userId,
      kind: body.kind,
      provider: body.provider,
      sourceEmail: body.sourceEmail,
      sourcePassword: body.sourcePassword,
      mailboxId: body.mailboxId,
      destinationPassword: body.destinationPassword,
    });
    return json({ migration }, 202);
  } catch (error) {
    return errorResponse(error);
  }
}
