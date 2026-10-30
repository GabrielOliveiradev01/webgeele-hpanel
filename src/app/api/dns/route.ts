import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/auth/account";
import {
  createDnsRecord,
  deleteDnsRecord,
  listDnsRecords,
} from "@/lib/dns/service";

export async function GET(request: Request) {
  const { account, error } = await requireAccount();
  if (error === "unauthenticated" || !account) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const domainId = new URL(request.url).searchParams.get("domainId") || undefined;
  const records = await listDnsRecords(account.id, domainId);
  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  const { account, error } = await requireAccount();
  if (error === "unauthenticated" || !account) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const record = await createDnsRecord({
      accountId: account.id,
      domainId: body.domainId,
      type: body.type,
      name: body.name,
      value: body.value,
      ttl: body.ttl,
      priority: body.priority,
    });
    return NextResponse.json({ record });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const { account, error } = await requireAccount();
  if (error === "unauthenticated" || !account) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  await deleteDnsRecord(account.id, id);
  return NextResponse.json({ ok: true });
}
