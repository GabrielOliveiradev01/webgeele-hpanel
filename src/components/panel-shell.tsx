"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Headphones,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { mainNav, navGroups } from "@/lib/nav";
import { NavIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";

function isActive(pathname: string, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initialsOf(label: string) {
  return (
    label
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "WG"
  );
}

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[72px] shrink-0 items-center px-6">
        <Link href="/" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-2 text-[11px] font-semibold tracking-[0.14em] text-wg-text-muted/70 uppercase">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={[
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                      active
                        ? "bg-wg-brand/[0.08] text-wg-brand"
                        : "text-wg-text-muted hover:bg-wg-surface hover:text-wg-graphite",
                    ].join(" ")}
                  >
                    {active ? (
                      <span className="absolute -left-4 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-wg-brand" />
                    ) : null}
                    <NavIcon
                      name={item.icon}
                      className={[
                        "h-[18px] w-[18px] shrink-0",
                        active ? "text-wg-brand" : "text-wg-text-muted group-hover:text-wg-graphite",
                      ].join(" ")}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 p-4">
        <div className="relative overflow-hidden rounded-2xl bg-wg-brand p-4 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(230,106,175,0.55),transparent_55%)]" />
          <div className="relative">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <Headphones className="h-4 w-4" />
            </span>
            <p className="mt-3 font-display text-sm font-semibold">Precisa de ajuda?</p>
            <p className="mt-1 text-xs leading-relaxed text-white/75">
              Nossa equipe responde em horário comercial.
            </p>
            <Link
              href="/suporte"
              onClick={onNavigate}
              className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-white px-3 py-2 text-xs font-semibold text-wg-brand transition hover:bg-white/90"
            >
              Abrir chamado
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserMenu({
  userLabel,
  userEmail,
  onLogout,
  loggingOut,
}: {
  userLabel: string;
  userEmail: string;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-3 rounded-xl py-1.5 pl-1.5 pr-2.5 transition hover:bg-wg-surface"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-wg-brand to-wg-pink text-xs font-semibold text-white">
          {initialsOf(userLabel)}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-[180px] truncate text-sm font-semibold text-wg-graphite">
            {userLabel}
          </span>
          <span className="block max-w-[180px] truncate text-xs text-wg-text-muted">
            {userEmail}
          </span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-wg-text-muted sm:block" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-wg-border bg-white p-2 shadow-[0_20px_50px_rgba(33,27,58,0.12)]">
          <div className="border-b border-wg-border px-3 pb-3 pt-2 sm:hidden">
            <p className="truncate text-sm font-semibold text-wg-graphite">{userLabel}</p>
            <p className="truncate text-xs text-wg-text-muted">{userEmail}</p>
          </div>
          <Link
            href="/conta"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-wg-graphite transition hover:bg-wg-surface"
          >
            <UserRound className="h-4 w-4 text-wg-text-muted" />
            Minha conta
          </Link>
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Saindo..." : "Sair da conta"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function PanelShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userLabel, setUserLabel] = useState("Cliente WebGeele");
  const [userEmail, setUserEmail] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email || "";
      const metaName =
        (data.user?.user_metadata?.legal_name as string | undefined) ||
        (data.user?.user_metadata?.full_name as string | undefined);
      setUserEmail(email);
      setUserLabel(metaName || email.split("@")[0] || "Cliente WebGeele");
    });
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.replace("/login");
    router.refresh();
  }

  const current = mainNav.find((item) => isActive(pathname, item.href));
  const currentGroup = navGroups.find((group) =>
    group.items.some((item) => item.href === current?.href),
  );

  return (
    <div className="min-h-screen bg-wg-surface">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-wg-border/70 bg-white lg:block">
        <SidebarNav pathname={pathname} />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-wg-graphite/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] bg-white shadow-2xl">
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-wg-text-muted hover:bg-wg-surface"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarNav pathname={pathname} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-wg-border/70 bg-white/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-wg-border text-wg-graphite lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav className="flex min-w-0 items-center gap-1.5 text-sm">
              <span className="hidden text-wg-text-muted sm:inline">
                {currentGroup?.title ?? "Painel"}
              </span>
              <ChevronRight className="hidden h-4 w-4 text-wg-text-muted/60 sm:block" />
              <span className="truncate font-semibold text-wg-graphite">
                {current?.label ?? "Painel"}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/suporte"
              aria-label="Suporte"
              className="hidden h-10 w-10 items-center justify-center rounded-xl text-wg-text-muted transition hover:bg-wg-surface hover:text-wg-graphite sm:flex"
            >
              <Headphones className="h-[18px] w-[18px]" />
            </Link>
            <span className="hidden h-6 w-px bg-wg-border sm:block" />
            <UserMenu
              userLabel={userLabel}
              userEmail={userEmail}
              onLogout={handleLogout}
              loggingOut={loggingOut}
            />
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
