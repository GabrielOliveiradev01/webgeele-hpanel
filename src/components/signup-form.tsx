"use client";

import { startingPriceLabel } from "@/lib/site";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Globe, Mail, MailCheck, User } from "lucide-react";
import { authErrorMessage } from "@/lib/auth/messages";
import {
  AuthError,
  AuthField,
  AuthShell,
  BrandPanel,
  PasswordField,
  authButtonClass,
} from "@/components/auth-shell";

const strengthLabels = ["Muito fraca", "Fraca", "Boa", "Forte"];
const strengthColors = ["bg-red-400", "bg-amber-400", "bg-emerald-400", "bg-wg-success"];

function passwordStrength(password: string) {
  if (!password) return 0;
  let score = password.length >= 8 ? 1 : 0;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.max(score, 1);
}

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email: normalizedEmail, password }),
    });
    const payload = (await response.json()) as { status?: string; error?: string };
    const query = `email=${encodeURIComponent(normalizedEmail)}`;

    if (!response.ok) {
      setLoading(false);
      setError(authErrorMessage(payload.error));
      return;
    }

    if (payload.status === "exists") {
      router.push(`/cadastro/ja-existe?${query}`);
      return;
    }

    router.push(`/cadastro/enviado?${query}`);
  }

  const strength = passwordStrength(password);

  return (
    <AuthShell
      panel={
        <BrandPanel
          title="Compre sua caixa de e-mail profissional com domínio próprio."
          description={`A partir de ${startingPriceLabel}/mês no plano anual. Cadastre-se, conecte seu domínio e use e-mails com a sua marca em minutos.`}
        >
          <OnboardingSteps />
        </BrandPanel>
      }
    >
      <h1 className="animate-fade-up font-display text-3xl font-semibold tracking-tight text-wg-graphite">
        Crie sua conta
      </h1>
      <p className="animate-fade-up-delay-1 mt-2 text-sm text-wg-text-muted">
        Conta individual: um usuário por painel, sem acesso compartilhado.
      </p>

      <form onSubmit={onSubmit} className="animate-fade-up-delay-2 mt-10 space-y-5">
        <AuthField
          label="Nome"
          icon={User}
          type="text"
          required
          autoComplete="name"
          placeholder="Seu nome ou razão social"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

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
          minLength={8}
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hint={
            password ? (
              <span className="flex items-center gap-3">
                <span className="grid flex-1 grid-cols-3 gap-1.5">
                  {[1, 2, 3].map((level) => (
                    <span
                      key={level}
                      className={`h-1.5 rounded-full transition ${
                        level <= strength ? strengthColors[strength] : "bg-wg-border"
                      }`}
                    />
                  ))}
                </span>
                <span className="w-20 text-right text-xs text-wg-text-muted">
                  {password.length < 8 ? strengthLabels[0] : strengthLabels[strength]}
                </span>
              </span>
            ) : (
              <span className="text-xs text-wg-text-muted">
                Use letras maiúsculas, números e símbolos.
              </span>
            )
          }
        />

        <AuthError message={error} />

        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? "Criando conta..." : "Criar conta"}
          {!loading ? (
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          ) : null}
        </button>
      </form>

      <p className="animate-fade-up-delay-3 mt-8 text-center text-sm text-wg-text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-wg-brand hover:underline">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}

function OnboardingSteps() {
  const steps = [
    {
      icon: User,
      title: "Crie sua conta",
      description: "Nome, e-mail e senha. Leva menos de um minuto.",
      done: true,
    },
    {
      icon: MailCheck,
      title: "Confirme seu e-mail",
      description: "Clique no link que enviamos para ativar o acesso.",
      done: false,
    },
    {
      icon: Globe,
      title: "Conecte seu domínio",
      description: "Aponte o DNS e crie as caixas de e-mail da sua empresa.",
      done: false,
    },
  ];

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-6 text-wg-graphite shadow-[0_30px_60px_rgba(20,10,60,0.35)]">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-semibold">Comece em 3 passos</p>
        <span className="rounded-full bg-wg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-wg-brand">
          1 de 3
        </span>
      </div>
      <ol className="relative mt-5 space-y-5">
        <span className="absolute bottom-4 left-[17px] top-4 w-px bg-wg-border" />
        {steps.map(({ icon: Icon, title, description, done }) => (
          <li key={title} className="relative flex gap-4">
            <span
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                done ? "bg-wg-brand text-white" : "bg-wg-surface text-wg-text-muted"
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </span>
            <span>
              <span className="block text-[13px] font-semibold">{title}</span>
              <span className="mt-0.5 block text-[12px] leading-relaxed text-wg-text-muted">
                {description}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
