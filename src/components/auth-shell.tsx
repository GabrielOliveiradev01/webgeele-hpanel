"use client";

import { useState } from "react";
import type { ComponentType, InputHTMLAttributes, ReactNode } from "react";
import { Eye, EyeOff, Headphones, Lock, Mail, ShieldCheck } from "lucide-react";
import { Logo, LogoMark } from "@/components/logo";

export const authInputClass =
  "w-full rounded-xl border border-wg-border bg-white py-3 pl-11 pr-4 text-sm text-wg-graphite outline-none transition placeholder:text-wg-text-muted/60 hover:border-wg-purple/40 focus:border-wg-brand focus:ring-4 focus:ring-wg-brand/10";

export const authButtonClass =
  "group flex w-full items-center justify-center gap-2 rounded-xl bg-wg-brand px-4 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(102,60,230,0.35)] transition hover:bg-wg-brand-dark disabled:opacity-60";

export function AuthShell({
  children,
  panel,
}: {
  children: ReactNode;
  panel: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-wg-surface p-3 sm:p-5">
      <div className="grid w-full overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_rgba(33,27,58,0.08)] lg:grid-cols-[1fr_1.05fr]">
        <section className="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
          <Logo className="animate-fade-up" />
          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
            {children}
          </div>
          <p className="text-center text-xs text-wg-text-muted">
            © {new Date().getFullYear()} WebGeele. Todos os direitos reservados.
          </p>
        </section>
        {panel}
      </div>
    </div>
  );
}

export function AuthField({
  label,
  icon: Icon,
  hint,
  ...inputProps
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  hint?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-wg-graphite">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-wg-text-muted" />
        <input {...inputProps} className={authInputClass} />
      </span>
      {hint}
    </label>
  );
}

export function PasswordField({
  label = "Senha",
  hint,
  ...inputProps
}: {
  label?: string;
  hint?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-wg-graphite">{label}</span>
      <span className="relative block">
        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-wg-text-muted" />
        <input
          {...inputProps}
          type={visible ? "text" : "password"}
          className={`${authInputClass} pr-12`}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-wg-text-muted transition hover:bg-wg-surface hover:text-wg-graphite"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
      {hint}
    </label>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      {message}
    </p>
  );
}

export function BrandPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="relative hidden overflow-hidden rounded-[22px] bg-wg-brand p-12 text-white lg:m-3 lg:flex lg:flex-col xl:p-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(230,106,175,0.45),transparent_40%),radial-gradient(circle_at_0%_100%,rgba(33,27,58,0.55),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(circle_at_50%_40%,black,transparent_75%)]" />
      <LogoMark
        color="rgba(255,255,255,0.06)"
        className="pointer-events-none absolute -bottom-24 -right-20 h-[420px] w-auto"
      />

      <div className="relative max-w-md">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20 backdrop-blur">
          <span className="h-1.5 w-1.5 animate-[soft-pulse_2s_ease-in-out_infinite] rounded-full bg-emerald-300" />
          Painel do cliente
        </span>
        <h2 className="mt-6 font-display text-4xl font-semibold leading-[1.15] tracking-tight">
          {title}
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-white/75">
          {description}
        </p>
      </div>

      <div className="relative mt-12 flex flex-1 items-center">{children}</div>

      <ul className="relative mt-12 grid grid-cols-3 gap-4 border-t border-white/15 pt-8 text-sm">
        {[
          { icon: ShieldCheck, label: "Acesso seguro" },
          { icon: Mail, label: "E-mail profissional" },
          { icon: Headphones, label: "Suporte dedicado" },
        ].map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-2 text-white/80">
            <Icon className="h-4 w-4 shrink-0 text-white" />
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}
