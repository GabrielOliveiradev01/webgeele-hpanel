import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/auth/account";
import { createExtraMailboxOrder } from "@/lib/billing/orders";

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return request.headers.get("x-real-ip") || "127.0.0.1";
}

export async function POST(request: Request) {
  const { account, error } = await requireAccount();
  if (error === "unauthenticated" || !account) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const quantity = Number(body.quantity || 1);
    const cycle = body.cycle === "annual" ? "annual" : "monthly";
    const planCode =
      body.planCode === "business" || body.planCode === "professional"
        ? body.planCode
        : "start";

    if (!body.creditCard || !body.holder) {
      return NextResponse.json(
        { error: "Informe os dados do cartão e do titular" },
        { status: 400 },
      );
    }

    const checkout = await createExtraMailboxOrder({
      accountId: account.id,
      quantity,
      cycle,
      planCode,
      remoteIp: clientIp(request),
      creditCard: {
        holderName: String(body.creditCard.holderName || ""),
        number: String(body.creditCard.number || ""),
        expiryMonth: String(body.creditCard.expiryMonth || ""),
        expiryYear: String(body.creditCard.expiryYear || ""),
        ccv: String(body.creditCard.ccv || ""),
      },
      holder: {
        name: String(body.holder.name || account.legal_name || account.email),
        email: String(body.holder.email || account.email),
        cpfCnpj: String(body.holder.cpfCnpj || account.document || ""),
        postalCode: String(body.holder.postalCode || ""),
        addressNumber: String(body.holder.addressNumber || "0"),
        phone: body.holder.phone ? String(body.holder.phone) : account.phone || undefined,
        mobilePhone: body.holder.mobilePhone
          ? String(body.holder.mobilePhone)
          : account.phone || undefined,
      },
    });

    return NextResponse.json({
      ...checkout,
      sandbox: (process.env.ASAAS_API_URL || "").includes("sandbox"),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha na compra" },
      { status: 400 },
    );
  }
}
