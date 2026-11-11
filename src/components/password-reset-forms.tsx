"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Lock, Mail, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/auth/messages";
import {
  AuthError,
  AuthField,
  AuthShell,
  BrandPanel,
  PasswordField,
  authButtonClass,
} from "@/components/auth-shell";

function ResetPanel() {
  return (
    <BrandPanel
      title="Recupere o acesso ao seu painel em poucos minutos."
      description="Enviamos um link seguro para o e-mail da sua conta. Ele vale por 1 hora e só pode ser usado uma vez."
    >
      <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur">
        <Lock className="h-5 w-5 shrink-0" />
        <p className="text-sm text-white/80">
          A WebGeele nunca pede sua senha por e-mail, telefone ou WhatsApp.
        </p>
      </div>
    </BrandPanel>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/nova-senha`,
    });
    setLoading(false);

    if (resetError) {
      setError(authErrorMessage(resetError.message));
      return;
    }
    // Mesma resposta exista ou não a conta, para não revelar quais e-mails estão cadastrados.
    setSent(true);
  }

  return (
    <AuthShell panel={<ResetPanel />}>
      {sent ? (
        <div className="animate-fade-up">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-wg-brand/10 text-wg-brand">
            <MailCheck className="h-6 w-6" />
          </span>
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-wg-graphite">
            Confira seu e-mail
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-wg-text-muted">
            Se existir uma conta com <strong className="text-wg-graphite">{email}</strong>, você vai
            receber um link para criar uma nova senha. Ele vale por 1 hora. Não chegou? Veja a pasta
            de spam ou lixo eletrônico.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-8 text-sm font-semibold text-wg-brand hover:underline"
          >
            Enviar para outro e-mail
          </button>
          <Link
            href="/login?email=redefinicao"
            className={`${authButtonClass} mt-6`}
          >
            Voltar ao login
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          <h1 className="animate-fade-up font-display text-3xl font-semibold tracking-tight text-wg-graphite">
            Esqueceu sua senha?
          </h1>
          <p className="animate-fade-up-delay-1 mt-2 text-sm text-wg-text-muted">
            Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.
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
            <AuthError message={error} />
            <button type="submit" disabled={loading} className={authButtonClass}>
              {loading ? "Enviando..." : "Enviar link de redefinição"}
              {!loading ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          </form>
        </>
      )}

      <p className="animate-fade-up-delay-3 mt-8 text-center text-sm text-wg-text-muted">
        <Link href="/login" className="inline-flex items-center gap-1.5 font-semibold text-wg-brand hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Voltar para o login
        </Link>
      </p>
    </AuthShell>
  );
}

export function NewPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não são iguais.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(authErrorMessage(updateError.message));
      return;
    }
    router.replace("/?senha=alterada");
    router.refresh();
  }

  return (
    <AuthShell panel={<ResetPanel />}>
      <h1 className="animate-fade-up font-display text-3xl font-semibold tracking-tight text-wg-graphite">
        Crie uma nova senha
      </h1>
      <p className="animate-fade-up-delay-1 mt-2 text-sm text-wg-text-muted">
        Use pelo menos 8 caracteres. Depois de salvar, você já entra no painel.
      </p>

      <form onSubmit={onSubmit} className="animate-fade-up-delay-2 mt-10 space-y-5">
        <PasswordField
          label="Nova senha"
          required
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <PasswordField
          label="Repita a nova senha"
          required
          autoComplete="new-password"
          placeholder="Digite a senha de novo"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
        <AuthError message={error} />
        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? "Salvando..." : "Salvar nova senha"}
          {!loading ? <ArrowRight className="h-4 w-4" /> : null}
        </button>
      </form>
    </AuthShell>
  );
}
