"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Globe, Mail, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/auth/messages";
import {
  AuthError,
  AuthField,
  AuthNotice,
  AuthShell,
  BrandPanel,
  PasswordField,
  authButtonClass,
} from "@/components/auth-shell";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<"info" | "success">("info");
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const paramError = searchParams.get("error");
    if (paramError) {
      setError(authErrorMessage(paramError));
      if (/email not confirmed|confirm/i.test(paramError)) {
        setNeedsConfirm(true);
      }
    }

    const sent = searchParams.get("email");
    if (sent === "enviado") {
      setNoticeTone("success");
      setNotice(
        "Enviamos um e-mail de confirmação. Abra a mensagem da WebGeele e clique no link para ativar sua conta.",
      );
    } else if (sent === "redefinicao") {
      setNoticeTone("success");
      setNotice(
        "Se o e-mail existir na WebGeele, enviamos um link para redefinir a senha. Confira a caixa de entrada e o spam.",
      );
    } else if (searchParams.get("confirmado") === "1") {
      setNoticeTone("success");
      setNotice("E-mail confirmado. Agora você já pode entrar no painel.");
    }
  }, [searchParams]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsConfirm(false);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      const message = authErrorMessage(signInError.message);
      setError(message);
      if (/email not confirmed/i.test(signInError.message)) {
        setNeedsConfirm(true);
        setNoticeTone("info");
        setNotice(
          "Sua conta ainda não foi ativada. Vamos enviar um novo e-mail de confirmação se você pedir abaixo.",
        );
      }
      return;
    }

    router.replace(searchParams.get("next") || "/");
    router.refresh();
  }

  async function resendConfirmation() {
    const target = email.trim();
    if (!target) {
      setError("Informe o e-mail da conta para reenviarmos a confirmação.");
      return;
    }

    setResending(true);
    setError(null);
    setNoticeTone("info");
    setNotice(`Enviando e-mail de confirmação para ${target}…`);

    const response = await fetch("/api/auth/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: target }),
    });
    const payload = (await response.json()) as { error?: string };
    setResending(false);

    if (!response.ok) {
      setNotice(null);
      setError(authErrorMessage(payload.error));
      return;
    }

    setNoticeTone("success");
    setNotice(
      `Enviamos um novo e-mail de confirmação para ${target}. Abra a mensagem e clique no link. Não chegou? Veja spam ou promoções.`,
    );
  }

  return (
    <AuthShell
      panel={
        <BrandPanel
          title="Seu e-mail profissional, domínios e faturas em um só lugar."
          description="Gerencie caixas de e-mail, acompanhe seu plano e fale com o suporte sem sair do painel WebGeele."
        >
          <MailboxPreview />
        </BrandPanel>
      }
    >
      <h1 className="animate-fade-up font-display text-3xl font-semibold tracking-tight text-wg-graphite">
        Bem-vindo de volta
      </h1>
      <p className="animate-fade-up-delay-1 mt-2 text-sm text-wg-text-muted">
        Entre com seu e-mail e senha para acessar o painel.
      </p>

      <form onSubmit={onSubmit} className="animate-fade-up-delay-2 mt-10 space-y-5">
        <AuthField
          label="E-mail"
          icon={Mail}
          type="email"
          required
          autoComplete="email"
          placeholder="voce@suaempresa.com.br"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <PasswordField
          required
          autoComplete="current-password"
          placeholder="Sua senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <div className="-mt-2 text-right">
          <Link href="/recuperar-senha" className="text-sm font-medium text-wg-brand hover:underline">
            Esqueci minha senha
          </Link>
        </div>

        <AuthNotice message={notice} tone={noticeTone} />
        <AuthError message={error} />

        {needsConfirm ? (
          <div className="rounded-xl border border-wg-border bg-wg-surface px-4 py-3">
            <p className="flex items-start gap-2 text-sm text-wg-graphite">
              <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-wg-brand" />
              <span>
                Ao reenviar, a WebGeele manda um link de ativação para o e-mail informado acima.
              </span>
            </p>
            <button
              type="button"
              disabled={resending || !email.trim()}
              onClick={resendConfirmation}
              className="mt-3 text-sm font-semibold text-wg-brand hover:underline disabled:opacity-50"
            >
              {resending ? "Enviando e-mail…" : "Reenviar e-mail de confirmação"}
            </button>
          </div>
        ) : null}

        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? "Entrando..." : "Entrar no painel"}
          {!loading ? (
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          ) : null}
        </button>
      </form>

      <p className="animate-fade-up-delay-3 mt-8 text-center text-sm text-wg-text-muted">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-wg-brand hover:underline">
          Cadastre-se
        </Link>
      </p>
    </AuthShell>
  );
}

function MailboxPreview() {
  return (
    <div className="relative w-full max-w-md">
      <div className="rounded-2xl bg-white p-5 text-wg-graphite shadow-[0_30px_60px_rgba(20,10,60,0.35)]">
        <div className="flex items-center justify-between">
          <p className="font-display text-sm font-semibold">Caixas de e-mail</p>
          <span className="rounded-full bg-wg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-wg-brand">
            3 de 5 em uso
          </span>
        </div>
        <ul className="mt-4 space-y-2.5">
          {[
            { name: "contato", color: "bg-wg-brand" },
            { name: "financeiro", color: "bg-wg-pink" },
            { name: "suporte", color: "bg-wg-graphite" },
          ].map((box) => (
            <li
              key={box.name}
              className="flex items-center gap-3 rounded-xl border border-wg-border px-3 py-2.5"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold uppercase text-white ${box.color}`}
              >
                {box.name[0]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">
                  {box.name}@suaempresa.com.br
                </span>
                <span className="block text-[11px] text-wg-text-muted">Caixa ativa</span>
              </span>
              <span className="h-2 w-2 rounded-full bg-wg-success" />
            </li>
          ))}
        </ul>
      </div>

      <div className="absolute -right-6 -top-16 w-52 rounded-2xl bg-white p-4 text-wg-graphite shadow-[0_20px_50px_rgba(20,10,60,0.35)] xl:-right-12">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-wg-success/10 text-wg-success">
            <Globe className="h-4 w-4" />
          </span>
          <p className="text-[13px] font-semibold">DNS configurado</p>
        </div>
        <ul className="mt-3 space-y-1.5">
          {["MX", "SPF", "DKIM"].map((record) => (
            <li key={record} className="flex items-center justify-between text-[12px]">
              <span className="font-medium text-wg-text-muted">{record}</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-wg-success" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
