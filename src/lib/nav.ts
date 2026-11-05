export type NavItem = {
  href: string;
  label: string;
  icon:
    | "overview"
    | "services"
    | "domains"
    | "dns"
    | "mailboxes"
    | "migration"
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

// Páginas fora do menu: acessadas a partir de outra tela, que fica destacada no menu.
export const subPages: Array<{ href: string; label: string; parent: string }> = [
  { href: "/migracao", label: "Migração de e-mails", parent: "/caixas" },
];
