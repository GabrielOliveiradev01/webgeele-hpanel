"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const origin = window.location.origin;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          full_name: name,
          legal_name: name,
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // Se o projeto confirmar automaticamente (não é o nosso caso), já haveria sessão.
    if (data.session) {
      window.location.href = "/";
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-wg-border bg-white p-8 shadow-[0_20px_60px_rgba(33,27,58,0.08)]">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-wg-purple to-wg-pink text-white">
          @
        </div>
        <h1 className="font-display text-2xl font-semibold text-wg-graphite">
          Confirme seu e-mail
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-wg-text-muted">
          Enviamos um link de confirmação para <strong>{email}</strong>. Abra o
          e-mail e clique no link para ativar o acesso ao painel.
        </p>
        <p className="mt-4 text-sm text-wg-text-muted">
          Não recebeu? Verifique spam ou{" "}
          <Link href="/login" className="font-medium text-wg-purple">
            tente entrar
          </Link>{" "}
          depois da confirmação.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-wg-border bg-white p-8 shadow-[0_20px_60px_rgba(33,27,58,0.08)]">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-wg-purple to-wg-pink font-display text-sm font-semibold text-white">
          WG
        </span>
        <div>
          <p className="font-display text-lg font-semibold text-wg-graphite">
            WebGeele
          </p>
          <p className="text-sm text-wg-text-muted">Criar conta no painel</p>
        </div>
      </div>

      <h1 className="font-display text-2xl font-semibold text-wg-graphite">
        Cadastre-se
      </h1>
      <p className="mt-2 text-sm text-wg-text-muted">
        Conta individual: um usuário por painel, sem acesso compartilhado.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-wg-graphite">Nome</span>
          <input
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-wg-border bg-wg-surface px-3.5 py-2.5 text-sm outline-none ring-wg-purple/30 focus:ring-2"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-wg-graphite">E-mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-wg-border bg-wg-surface px-3.5 py-2.5 text-sm outline-none ring-wg-purple/30 focus:ring-2"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-wg-graphite">Senha</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-wg-border bg-wg-surface px-3.5 py-2.5 text-sm outline-none ring-wg-purple/30 focus:ring-2"
          />
          <span className="text-xs text-wg-text-muted">Mínimo de 8 caracteres</span>
        </label>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-wg-graphite px-4 py-3 text-sm font-medium text-white transition hover:bg-wg-graphite-soft disabled:opacity-60"
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-wg-text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-wg-purple">
          Entrar
        </Link>
      </p>
    </div>
  );
}
