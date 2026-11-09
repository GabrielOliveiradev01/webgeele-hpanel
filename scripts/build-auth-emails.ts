// Gera os modelos de e-mail do Supabase Auth com o layout da WebGeele.
// Uso: node scripts/build-auth-emails.ts  → arquivos em supabase/templates/
// Depois, cole cada um em Supabase → Authentication → Emails (ou use supabase/config.toml).
import { mkdirSync, writeFileSync } from "node:fs";
import { renderEmail } from "../src/lib/email/layout.ts";

// Os links usam token_hash + /auth/confirm para funcionar em qualquer aparelho
// (o link padrão do Supabase só funciona no mesmo navegador que pediu).
const confirm = (type: string, next: string) =>
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=${type}&next=${next}`;

const templates = [
  {
    file: "confirmacao.html",
    subject: "Confirme seu cadastro na WebGeele",
    html: renderEmail({
      preheader: "Falta só um clique para ativar sua conta.",
      title: "Confirme seu e-mail",
      paragraphs: [
        "Recebemos seu cadastro na WebGeele. Clique no botão abaixo para confirmar seu e-mail e acessar o painel.",
      ],
      button: { label: "Confirmar meu e-mail", href: confirm("email", "/") },
      footnote:
        "O link vale por 24 horas. Se você não se cadastrou na WebGeele, ignore esta mensagem.",
    }),
  },
  {
    file: "redefinir-senha.html",
    subject: "Redefina sua senha da WebGeele",
    html: renderEmail({
      preheader: "Use o link para criar uma nova senha.",
      title: "Redefinir sua senha",
      paragraphs: [
        "Recebemos um pedido para redefinir a senha da sua conta na WebGeele. Clique no botão abaixo para criar uma nova senha.",
      ],
      button: { label: "Criar nova senha", href: confirm("recovery", "/nova-senha") },
      footnote:
        "O link vale por 1 hora e só pode ser usado uma vez. Se você não pediu a troca, ignore esta mensagem: sua senha continua a mesma.",
    }),
  },
  {
    file: "link-magico.html",
    subject: "Seu link de acesso à WebGeele",
    html: renderEmail({
      preheader: "Entre no painel com um clique.",
      title: "Entrar no painel",
      paragraphs: ["Clique no botão abaixo para entrar no seu painel WebGeele."],
      button: { label: "Entrar no painel", href: confirm("magiclink", "/") },
      footnote: "O link vale por 1 hora. Se não foi você, ignore esta mensagem.",
    }),
  },
  {
    file: "troca-email.html",
    subject: "Confirme seu novo e-mail na WebGeele",
    html: renderEmail({
      preheader: "Confirme a troca do e-mail da sua conta.",
      title: "Confirme seu novo e-mail",
      paragraphs: [
        "Você pediu para trocar o e-mail da sua conta de <strong>{{ .Email }}</strong> para <strong>{{ .NewEmail }}</strong>. Clique no botão abaixo para confirmar.",
      ],
      button: { label: "Confirmar novo e-mail", href: confirm("email_change", "/conta") },
      footnote: "Se não foi você, ignore esta mensagem e o e-mail continua o mesmo.",
    }),
  },
  {
    file: "convite.html",
    subject: "Você foi convidado para a WebGeele",
    html: renderEmail({
      preheader: "Aceite o convite para acessar o painel.",
      title: "Você recebeu um convite",
      paragraphs: [
        "Você foi convidado para acessar um painel da WebGeele. Clique no botão abaixo para aceitar e criar sua senha.",
      ],
      button: { label: "Aceitar convite", href: confirm("invite", "/nova-senha") },
    }),
  },
];

mkdirSync("supabase/templates", { recursive: true });
for (const t of templates) writeFileSync(`supabase/templates/${t.file}`, t.html);
writeFileSync(
  "supabase/templates/ASSUNTOS.md",
  templates.map((t) => `- ${t.file}: ${t.subject}`).join("\n") + "\n",
);
console.log(templates.map((t) => t.file).join(", "));
