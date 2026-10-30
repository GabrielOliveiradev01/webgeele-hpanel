import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

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
  title: {
    default: "Painel do cliente | WebGeele",
    template: "%s | WebGeele",
  },
  description:
    "Área do cliente WebGeele para gerenciar conta, serviços, domínios, DNS, plano, financeiro e suporte.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${plusJakarta.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-wg-surface text-wg-text">
        <div className="min-h-screen">
          <Sidebar />
          <div className="lg:pl-[272px]">
            <main className="panel-atmosphere min-h-screen px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <div className="mx-auto w-full max-w-6xl">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
