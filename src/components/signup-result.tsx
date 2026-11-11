"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, MailCheck } from "lucide-react";
import { authErrorMessage } from "@/lib/auth/messages";
import {
  AuthError,
  AuthShell,
  BrandPanel,
  authButtonClass,
} from "@/components/auth-shell";

function emailFromQuery(value: string | null) {
  const email = (value ?? "").trim().toLowerCase();
  if (!email.includes("@")) return "";
  return email;
}

export function SignupSentPage() {
  const searchParams = useSearchParams();
  const email = emailFromQuery(searchParams.get("email"));
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    if (!email) return;
    setResending(true);
    setError(null);
    const response = await fetch("/api/auth/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const payload = (await response.json()) as { error?: string };
    setResending(false);
    if (!response.ok) {
      setError(authErrorMessage(payload.error));
      return;
    }
    setResent(true);
  }

  return (
    <AuthShell
      panel={
        <BrandPanel
          title="Falta só confirmar o e-mail."
          description="O link de ativação já foi enviado. Abra a mensagem da WebGeele para liberar o painel."
        >
          <div />
        </BrandPanel>
      }
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-wg-brand/10 text-wg-brand">
        <MailCheck className="h-7 w-7" />
      </span>
      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-wg-graphite">
        Enviamos um e-mail de confirmação para {email || "o endereço informado"}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-wg-text-muted">
        Abra a caixa de entrada e clique no link. Se não aparecer, veja spam ou promoções.
      </p>
      {resent ? (
        <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          Enviamos de novo para {email}.
        </p>
      ) : null}
      <AuthError message={error} />
      {email ? (
        <button
          type="button"
          disabled={resending}
          onClick={resend}
          className="mt-6 text-sm font-semibold text-wg-brand hover:underline disabled:opacity-50"
        >
          {resending ? "Enviando..." : "Enviar de novo"}
        </button>
      ) : null}
      <Link href="/login" className={`${authButtonClass} mt-8`}>
        Ir para o login
        <ArrowRight className="h-4 w-4" />
      </Link>
    </AuthShell>
  );
}

export function SignupExistsPage() {
  const searchParams = useSearchParams();
  const email = emailFromQuery(searchParams.get("email"));
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    if (!email) return;
    setSending(true);
    setError(null);
    const response = await fetch("/api/auth/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const payload = (await response.json()) as { error?: string };
    setSending(false);
    if (!response.ok) {
      setError(authErrorMessage(payload.error));
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell
      panel={
        <BrandPanel
          title="Esse e-mail já está na WebGeele."
          description="Use o login ou peça uma nova senha. Nenhum e-mail de confirmação foi enviado agora."
        >
          <div />
        </BrandPanel>
      }
    >
      <h1 className="font-display text-3xl font-semibold tracking-tight text-wg-graphite">
        Este e-mail já existe
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-wg-text-muted">
        Já existe uma conta com{" "}
        <strong className="text-wg-graphite">{email || "esse endereço"}</strong>.
      </p>
      {sent ? (
        <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          Enviamos um e-mail de confirmação para {email}.
        </p>
      ) : null}
      <AuthError message={error} />
      {email ? (
        <button
          type="button"
          disabled={sending}
          onClick={resend}
          className="mt-6 text-sm font-semibold text-wg-brand hover:underline disabled:opacity-50"
        >
          {sending ? "Enviando..." : "Enviar e-mail de confirmação"}
        </button>
      ) : null}
      <Link href="/login" className={`${authButtonClass} mt-8`}>
        Entrar
        <ArrowRight className="h-4 w-4" />
      </Link>
      <p className="mt-6 text-center text-sm text-wg-text-muted">
        <Link href="/recuperar-senha" className="font-semibold text-wg-brand hover:underline">
          Esqueci minha senha
        </Link>
      </p>
    </AuthShell>
  );
}
