import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 465);
  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    from: process.env.MAIL_FROM || `WebGeele <${user}>`,
  };
}

export function emailConfigured() {
  return smtpConfig() !== null;
}

export async function sendEmail(input: { to: string; subject: string; html: string; text: string }) {
  const config = smtpConfig();
  if (!config) throw new Error("SMTP não configurado (SMTP_HOST, SMTP_USER, SMTP_PASSWORD).");

  transporter ??= nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  await transporter.sendMail({ from: config.from, ...input });
}
