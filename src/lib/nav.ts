export type NavItem = {
  href: string;
  label: string;
  icon:
    | "overview"
    | "services"
    | "domains"
    | "dns"
    | "account"
    | "plan"
    | "billing"
    | "support"
    | "business"
    | "directory";
};

export const mainNav: NavItem[] = [
  { href: "/", label: "Visão geral", icon: "overview" },
  { href: "/servicos", label: "Meus serviços", icon: "services" },
  { href: "/dominios", label: "Domínios", icon: "domains" },
  { href: "/dns", label: "DNS", icon: "dns" },
  { href: "/conta", label: "Minha conta", icon: "account" },
  { href: "/plano", label: "Plano e consumo", icon: "plan" },
  { href: "/financeiro", label: "Financeiro", icon: "billing" },
  { href: "/suporte", label: "Suporte", icon: "support" },
];

export const moduleNav: NavItem[] = [
  { href: "/perfil-empresarial", label: "Perfil empresarial", icon: "business" },
  { href: "/diretorio", label: "Diretório de empresas", icon: "directory" },
];
