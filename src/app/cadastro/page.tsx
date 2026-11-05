import type { Metadata } from "next";
import { SignupForm } from "@/components/signup-form";
import { SignupSeoSection } from "@/components/signup-seo-section";
import { productJsonLd, seoDescription, startingPriceLabel } from "@/lib/site";

export const metadata: Metadata = {
  title: `Comprar caixa de e-mail profissional a partir de ${startingPriceLabel}/mês`,
  description: seoDescription,
  alternates: { canonical: "/cadastro" },
  robots: { index: true, follow: true },
};

export default function CadastroPage() {
  return (
    <>
      <script
        type="application/ld+json"
        // JSON gerado no servidor a partir dos planos; "<" escapado para não fechar a tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd()).replace(/</g, "\\u003c"),
        }}
      />
      <div id="topo">
        <SignupForm />
      </div>
      <SignupSeoSection />
    </>
  );
}
