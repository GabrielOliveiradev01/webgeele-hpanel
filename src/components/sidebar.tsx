"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { navGroups } from "@/lib/nav";
import { NavIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

function isActive(pathname: string, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-3 px-1">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-wg-graphite text-sm font-semibold text-white">
        WG
      </span>
      <span className="min-w-0">
        <span className="block font-display text-[15px] font-semibold tracking-tight text-wg-graphite">
          WebGeele
        </span>
        <span className="block truncate text-[12px] text-wg-text-muted">painel.webgeele</span>
      </span>
    </Link>
  );
}

function SidebarBody({
  pathname,
  onNavigate,
  userLabel,
  userEmail,
  onLogout,
  loggingOut,
}: {
  pathname: string;
  onNavigate?: () => void;
  userLabel: string;
  userEmail: string;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const initials =
    userLabel
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "WG";

  return (
    <div className="flex h-full flex-col bg-[#f7f7f8]">
      <div className="border-b border-black/[0.06] px-5 py-5">
        <BrandMark />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold tracking-[0.12em] text-wg-text-muted uppercase">
              {group.title}
            </p>
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={[
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-white text-wg-graphite shadow-[0_1px_2px_rgba(16,24,40,0.06)] ring-1 ring-black/[0.04]"
                      : "text-wg-text-muted hover:bg-white/70 hover:text-wg-graphite",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      active ? "bg-wg-graphite text-white" : "bg-black/[0.04] text-wg-text-muted",
                    ].join(" ")}
                  >
                    <NavIcon name={item.icon} className="h-4 w-4" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-black/[0.06] p-4">
        <Link
          href="/suporte"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl bg-white px-3 py-3 text-sm text-wg-text-muted ring-1 ring-black/[0.04] transition hover:text-wg-graphite"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.04]">
            <NavIcon name="support" className="h-4 w-4" />
          </span>
          <span>
            <span className="block font-medium text-wg-graphite">Central de ajuda</span>
            <span className="block text-xs text-wg-text-muted">Abrir chamado</span>
          </span>
        </Link>

        <div className="rounded-xl bg-white p-2 ring-1 ring-black/[0.04]">
          <div className="flex items-center gap-3 px-1 py-1">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-wg-graphite text-sm font-semibold text-white">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-wg-graphite">
                {userLabel}
              </span>
              <span className="block truncate text-xs text-wg-text-muted">{userEmail}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-wg-text-muted transition hover:bg-black/[0.04] hover:text-wg-graphite disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {loggingOut ? "Saindo..." : "Sair da conta"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mountedPath, setMountedPath] = useState("");
  const [userLabel, setUserLabel] = useState("Cliente WebGeele");
  const [userEmail, setUserEmail] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setMountedPath(pathname);
  }, [pathname]);

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

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] border-r border-black/[0.06] lg:block">
        <SidebarBody
          pathname={mountedPath}
          userLabel={userLabel}
          userEmail={userEmail}
          onLogout={handleLogout}
          loggingOut={loggingOut}
        />
      </aside>

      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-black/[0.06] bg-white/90 px-4 py-3 backdrop-blur-md lg:hidden">
        <BrandMark />
        <button
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-wg-graphite text-white"
        >
          {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[286px] bg-[#f7f7f8] shadow-2xl">
            <SidebarBody
              pathname={mountedPath}
              onNavigate={() => setOpen(false)}
              userLabel={userLabel}
              userEmail={userEmail}
              onLogout={handleLogout}
              loggingOut={loggingOut}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}
