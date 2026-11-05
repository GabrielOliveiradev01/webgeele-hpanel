import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar no painel",
  description:
    "Acesse o painel WebGeele para gerenciar suas caixas de e-mail profissional, domínios e faturas.",
  alternates: { canonical: "/login" },
  robots: { index: true, follow: true },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
