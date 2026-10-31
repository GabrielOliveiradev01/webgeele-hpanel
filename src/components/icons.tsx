import type { NavItem } from "@/lib/nav";
import {
  CircleHelp,
  CreditCard,
  Gauge,
  Globe2,
  Inbox,
  ArrowRightLeft,
  LayoutDashboard,
  Network,
  Package,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<NavItem["icon"], LucideIcon> = {
  overview: LayoutDashboard,
  services: Package,
  domains: Globe2,
  dns: Network,
  mailboxes: Inbox,
  migration: ArrowRightLeft,
  account: ShieldCheck,
  plan: Gauge,
  billing: CreditCard,
  support: CircleHelp,
};

export function NavIcon({
  name,
  className,
}: {
  name: NavItem["icon"];
  className?: string;
}) {
  const Icon = iconMap[name];
  return <Icon className={className} strokeWidth={1.75} aria-hidden />;
}
