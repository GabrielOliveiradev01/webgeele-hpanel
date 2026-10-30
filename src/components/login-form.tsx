"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const paramError = searchParams.get("error");
    if (paramError) setError(paramError);
  }, [searchParams]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace(searchParams.get("next") || "/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(113,89,233,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(230,106,175,0.16),transparent_30%),#f6f4fb] px-4">
      <div className="w-full max-w-md rounded-3xl border border-wg-border bg-white p-8 shadow-[0_20px_60px_rgba(33,27,58,0.08)]">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-wg-purple to-wg-pink font-display text-sm font-semibold text-white">
            WG
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-wg-graphite">
              WebGeele
            </p>
            <p className="text-sm text-wg-text-muted">Painel do cliente</p>
          </div>
        </div>

        <h1 className="font-display text-2xl font-semibold text-wg-graphite">
          Entrar na conta
        </h1>
        <p className="mt-2 text-sm text-wg-text-muted">
          Acesso individual — um usuário por conta, sem compartilhamento.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
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
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-wg-border bg-wg-surface px-3.5 py-2.5 text-sm outline-none ring-wg-purple/30 focus:ring-2"
            />
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
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-wg-text-muted">
          Não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-wg-purple">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
