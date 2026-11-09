import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/site";
import { escapeHtml, renderEmail } from "@/lib/email/layout";
import { emailConfigured, sendEmail } from "@/lib/email/send";

/**
 * Envia o e-mail de boas-vindas uma única vez por conta.
 * Marca welcome_email_sent_at antes de enviar: se dois pedidos chegarem juntos,
 * só um consegue marcar e só esse envia.
 */
export async function sendWelcomeEmailOnce(userId: string) {
  if (!emailConfigured()) return;

  const admin = createAdminClient();
  const { data: account } = await admin
    .from("accounts")
    .update({ welcome_email_sent_at: new Date().toISOString() })
    .eq("owner_user_id", userId)
    .is("welcome_email_sent_at", null)
    .select("id, email, legal_name")
    .maybeSingle();

  if (!account?.email) return;

  const firstName = (account.legal_name || "").trim().split(/\s+/)[0] || "";
  const greeting = firstName ? `Boas-vindas, ${escapeHtml(firstName)}!` : "Boas-vindas à WebGeele!";
  const panel = siteUrl.replace(/\/$/, "");

  const html = renderEmail({
    preheader: "Sua conta está pronta. Veja como ativar seu e-mail profissional.",
    title: greeting,
    paragraphs: [
      "Sua conta na WebGeele está confirmada. Agora faltam três passos para ter seu e-mail profissional funcionando:",
      `<strong style="color:#211b3a;">1. Adicione seu domínio</strong> em Domínios. Mostramos os registros de DNS para você cadastrar onde o domínio está hospedado.<br>
<strong style="color:#211b3a;">2. Escolha seu plano</strong>: Start, Business ou Business Plus, a partir de R$ 4,90 por mês no anual.<br>
<strong style="color:#211b3a;">3. Crie suas caixas</strong>, como contato@suaempresa.com.br, e acesse pelo webmail.`,
      "Já tem e-mails em outro provedor? Você pode trazer as mensagens antigas pelo painel, sem perder nada.",
    ],
    button: { label: "Abrir meu painel", href: `${panel}/` },
    footnote: `Precisa de ajuda? Abra um chamado em <a href="${panel}/suporte" style="color:#663ce6;">Suporte</a> que nossa equipe responde em horário comercial.`,
  });

  const text = [
    firstName ? `Boas-vindas, ${firstName}!` : "Boas-vindas à WebGeele!",
    "",
    "Sua conta está confirmada. Próximos passos:",
    "1. Adicione seu domínio em Domínios e cadastre os registros de DNS.",
    "2. Escolha seu plano: Start, Business ou Business Plus, a partir de R$ 4,90/mês no anual.",
    "3. Crie suas caixas e acesse pelo webmail.",
    "",
    `Painel: ${panel}/`,
    `Suporte: ${panel}/suporte`,
  ].join("\n");

  try {
    await sendEmail({ to: account.email, subject: "Boas-vindas à WebGeele", html, text });
  } catch (error) {
    // Libera para tentar de novo no próximo acesso pelo link de confirmação.
    await admin.from("accounts").update({ welcome_email_sent_at: null }).eq("id", account.id);
    console.error("[email] falha ao enviar boas-vindas", (error as Error).message);
  }
}
