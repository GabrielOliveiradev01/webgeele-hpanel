import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/auth/account";
import {
  addExternalDomain,
  createDomainOrder,
  listDomains,
  updateDomainNameservers,
} from "@/lib/domains/service";
import { markOrderPaidLocally } from "@/lib/billing/orders";

export async function GET() {
  const { account, error } = await requireAccount();
  if (error === "unauthenticated") {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!account) return NextResponse.json({ domains: [] });

  const domains = await listDomains(account.id);
  return NextResponse.json({ domains });
}

export async function POST(request: Request) {
  const { account, error } = await requireAccount();
  if (error === "unauthenticated" || !account) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === "add_external") {
      const result = await addExternalDomain(account.id, body.name);
      return NextResponse.json(result);
    }

    if (action === "register" || action === "transfer") {
      const order = await createDomainOrder({
        accountId: account.id,
        domain: body.name,
        type: action === "transfer" ? "domain_transfer" : "domain_register",
        authCode: body.authCode,
        billingType: body.billingType || "PIX",
      });

      // Sandbox: libera imediatamente para o painel funcionar sem webhook externo
      if (process.env.ASAAS_API_URL?.includes("sandbox")) {
        await markOrderPaidLocally(order.id, account.id);
      }

      return NextResponse.json({ order });
    }

    if (action === "nameservers") {
      const domain = await updateDomainNameservers(
        account.id,
        body.domainId,
        body.nameservers || [],
      );
      return NextResponse.json({ domain });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha" },
      { status: 400 },
    );
  }
}
