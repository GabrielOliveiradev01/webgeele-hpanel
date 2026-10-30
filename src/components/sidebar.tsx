"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import { mainNav, moduleNav } from "@/lib/nav";
import { NavIcon } from "@/components/icons";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandMark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const title = tone === "dark" ? "text-white" : "text-wg-graphite";
  const subtitle = tone === "dark" ? "text-white/55" : "text-wg-text-muted";

  return (
    <Link href="/" className="flex items-center gap-3 px-1">
      <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-wg-purple to-wg-pink shadow-[0_8px_20px_rgba(113,89,233,0.35)]">
        <span className="font-display text-sm font-semibold tracking-tight text-white">
          WG
        </span>
      </span>
      <span className="min-w-0">
        <span className={`block font-display text-[15px] font-semibold tracking-tight ${title}`}>
          WebGeele
        </span>
        <span className={`block text-[11px] font-medium tracking-[0.08em] uppercase ${subtitle}`}>
          Painel do cliente
        </span>
      </span>
    </Link>
  );
}

function NavSection({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title?: string;
  items: typeof mainNav;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1.5">
      {title ? (
        <p className="px-3 pb-1 text-[11px] font-semibold tracking-[0.12em] text-white/40 uppercase">
          {title}
        </p>
      ) : null}
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={[
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                : "text-white/65 hover:bg-white/6 hover:text-white",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                active
                  ? "bg-gradient-to-br from-wg-purple to-wg-pink text-white"
                  : "bg-white/6 text-white/70 group-hover:bg-white/10 group-hover:text-white",
              ].join(" ")}
            >
              <NavIcon name={item.icon} className="h-4 w-4" />
            </span>
            <span className="truncate">{item.label}</span>
            {active ? (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-wg-pink shadow-[0_0_10px_rgba(230,106,175,0.9)]" />
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

function SidebarBody({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/8 px-5 py-5">
        <BrandMark />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        <NavSection items={mainNav} pathname={pathname} onNavigate={onNavigate} />
        <NavSection
          title="Módulos"
          items={moduleNav}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      </nav>

      <div className="space-y-3 border-t border-white/8 p-4">
        <Link
          href="/suporte"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl bg-white/6 px-3 py-3 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-wg-purple/25 text-wg-pink">
            <NavIcon name="support" className="h-4 w-4" />
          </span>
          <span>
            <span className="block font-medium text-white">Central de ajuda</span>
            <span className="block text-xs text-white/45">Abrir chamado ou FAQ</span>
          </span>
        </Link>

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/6"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-wg-purple to-wg-pink text-sm font-semibold text-white">
            MS
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">
              Maria Silva
            </span>
            <span className="block truncate text-xs text-white/45">
              maria@empresa.com.br
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-white/40" />
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] bg-wg-graphite lg:block">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(113,89,233,0.28),transparent_42%),radial-gradient(circle_at_80%_100%,rgba(230,106,175,0.18),transparent_40%)]" />
        <div className="relative h-full">
          <SidebarBody pathname={pathname} />
        </div>
      </aside>

      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-wg-border/80 bg-white/85 px-4 py-3 backdrop-blur-md lg:hidden">
        <BrandMark tone="light" />
        <button
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-wg-graphite text-white"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-wg-graphite/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[286px] bg-wg-graphite shadow-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(113,89,233,0.28),transparent_42%),radial-gradient(circle_at_80%_100%,rgba(230,106,175,0.18),transparent_40%)]" />
            <div className="relative h-full">
              <SidebarBody pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
