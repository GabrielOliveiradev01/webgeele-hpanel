import { createAdminClient } from "@/lib/supabase/admin";
import { escapeHtml, renderEmail } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/send";

function siteOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) return origin.replace(/\/$/, "");
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return configured || "https://hpanel.webgeele.com.br";
}

function confirmLink(origin: string, tokenHash: string, type: string) {
  const params = new URLSearchParams({
    token_hash: tokenHash,
    type,
    next: "/",
  });
  return `${origin}/auth/confirm?${params.toString()}`;
}

async function deliverConfirmation(email: string, href: string) {
  const safeEmail = escapeHtml(email);
  const html = renderEmail({
    preheader: "Falta só um clique para ativar sua conta.",
    title: "Confirme seu e-mail",
    paragraphs: [
      `Recebemos seu cadastro na WebGeele para <strong>${safeEmail}</strong>. Clique no botão abaixo para confirmar o e-mail e acessar o painel.`,
    ],
    button: { label: "Confirmar meu e-mail", href },
    footnote: "O link vale por 24 horas. Se você não se cadastrou na WebGeele, ignore esta mensagem.",
  });

  await sendEmail({
    to: email,
    subject: "Confirme seu e-mail na WebGeele",
    html,
    text: `Confirme seu e-mail na WebGeele (${email}): ${href}`,
  });
}

export async function registerAccount(input: {
  request: Request;
  name: string;
  email: string;
  password: string;
}) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const admin = createAdminClient();
  const origin = siteOrigin(input.request);

  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password: input.password,
    options: {
      data: { full_name: name, legal_name: name },
      redirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    if (/already|registered|exists/i.test(error.message)) {
      return { status: "exists" as const, email };
    }
    throw error;
  }

  const tokenHash = data.properties?.hashed_token;
  const type = data.properties?.verification_type || "signup";
  if (!tokenHash || !data.user?.id) {
    throw new Error("Não foi possível gerar o link de confirmação.");
  }

  try {
    await deliverConfirmation(email, confirmLink(origin, tokenHash, type));
  } catch (sendError) {
    console.error("[signup] falha ao enviar", sendError);
    await admin.auth.admin.deleteUser(data.user.id).catch(() => undefined);
    throw new Error("Não conseguimos enviar o e-mail de confirmação. Tente de novo em instantes.");
  }

  return { status: "sent" as const, email };
}

export async function resendConfirmation(input: { request: Request; email: string }) {
  const email = input.email.trim().toLowerCase();
  const admin = createAdminClient();
  const origin = siteOrigin(input.request);

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${origin}/auth/confirm` },
  });

  if (error || !data.properties?.hashed_token) {
    throw new Error(error?.message || "Não foi possível reenviar o e-mail.");
  }

  const type = data.properties.verification_type || "magiclink";
  await deliverConfirmation(email, confirmLink(origin, data.properties.hashed_token, type));
  return { status: "sent" as const, email };
}
