import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { processAsaasWebhook } from "@/lib/billing/asaas-webhook";

export async function POST(request: Request) {
  const configuredToken = env.asaasWebhookToken();
  if (configuredToken) {
    const headerToken =
      request.headers.get("asaas-access-token") ||
      request.headers.get("x-asaas-token") ||
      new URL(request.url).searchParams.get("token");

    if (headerToken !== configuredToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const payload = await request.json();
    const result = await processAsaasWebhook(payload);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Asaas webhook error", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook failed",
      },
      { status: 500 },
    );
  }
}
