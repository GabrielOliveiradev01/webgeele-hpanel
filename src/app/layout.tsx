import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import "./globals.css";
import { seoDescription, seoKeywords, siteName, siteUrl } from "@/lib/site";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: "E-mail profissional com domínio próprio | WebGeele",
    template: "%s | WebGeele",
  },
  description: seoDescription,
  keywords: seoKeywords,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName,
    title: "Caixa de e-mail profissional com domínio próprio | WebGeele",
    description: seoDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "Caixa de e-mail profissional com domínio próprio | WebGeele",
    description: seoDescription,
  },
  // Áreas logadas não devem ir para o Google; páginas públicas liberam no próprio metadata.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${plusJakarta.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-wg-surface text-wg-text">{children}</body>
    </html>
  );
}
