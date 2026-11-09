// Layout dos e-mails da WebGeele. Tabelas e estilos inline porque Gmail e Outlook
// ignoram CSS externo. Os modelos do Supabase em supabase/templates usam esta mesma base.

export const BRAND = "#663ce6";

export type EmailContent = {
  preheader: string;
  title: string;
  /** Parágrafos em HTML simples (já escapados). */
  paragraphs: string[];
  button?: { label: string; href: string };
  /** Linhas pequenas abaixo do botão. */
  footnote?: string;
};

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderEmail({ preheader, title, paragraphs, button, footnote }: EmailContent) {
  const body = paragraphs
    .map(
      (text) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#4b4763;">${text}</p>`,
    )
    .join("");

  const cta = button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr><td style="border-radius:12px;background:${BRAND};">
<a href="${button.href}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">${button.label}</a>
</td></tr></table>`
    : "";

  const note = footnote
    ? `<p style="margin:0;font-size:13px;line-height:20px;color:#8a86a0;">${footnote}</p>`
    : "";

  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f2fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2fb;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding:0 8px 20px;font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#211b3a;">Web<span style="color:${BRAND};">Geele</span></td></tr>
<tr><td style="background:#ffffff;border-radius:20px;padding:40px 36px;box-shadow:0 10px 30px rgba(33,27,58,0.06);">
<h1 style="margin:0 0 20px;font-size:24px;line-height:32px;font-weight:700;color:#211b3a;">${title}</h1>
${body}${cta}${note}
</td></tr>
<tr><td style="padding:24px 8px 0;font-size:12px;line-height:18px;color:#8a86a0;text-align:center;">
WebGeele · E-mail profissional com domínio próprio<br>
Você recebeu esta mensagem porque tem uma conta na WebGeele.
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
