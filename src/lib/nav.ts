export type NavItem = {
  href: string;
  label: string;
  icon:
    | "overview"
    | "services"
    | "domains"
    | "dns"
    | "mailboxes"
    | "account"
    | "plan"
    | "billing"
    | "support";
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    title: "Visão geral",
    items: [
      { href: "/", label: "Dashboard", icon: "overview" },
      { href: "/servicos", label: "Meus serviços", icon: "services" },
      { href: "/plano", label: "Plano e consumo", icon: "plan" },
    ],
  },
  {
    title: "Ferramentas",
    items: [
      { href: "/caixas", label: "Caixas de entrada", icon: "mailboxes" },
      { href: "/dominios", label: "Domínios", icon: "domains" },
      { href: "/dns", label: "DNS", icon: "dns" },
      { href: "/suporte", label: "Suporte", icon: "support" },
    ],
  },
  {
    title: "Conta",
    items: [
      { href: "/conta", label: "Minha conta", icon: "account" },
      { href: "/financeiro", label: "Financeiro", icon: "billing" },
    ],
  },
];

export const mainNav: NavItem[] = navGroups.flatMap((group) => group.items);
