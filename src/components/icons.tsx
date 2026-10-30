import type { NavItem } from "@/lib/nav";
import {
  Building2,
  CircleHelp,
  CreditCard,
  Gauge,
  Globe2,
  LayoutDashboard,
  Network,
  Package,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<NavItem["icon"], LucideIcon> = {
  overview: LayoutDashboard,
  services: Package,
  domains: Globe2,
  dns: Network,
  account: ShieldCheck,
  plan: Gauge,
  billing: CreditCard,
  support: CircleHelp,
  business: Building2,
  directory: UsersRound,
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
