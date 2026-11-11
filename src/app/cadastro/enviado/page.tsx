import { Suspense } from "react";
import type { Metadata } from "next";
import { SignupSentPage } from "@/components/signup-result";

export const metadata: Metadata = {
  title: "E-mail de confirmação enviado",
  robots: { index: false, follow: false },
};

export default function CadastroEnviadoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-wg-text-muted">
          Carregando...
        </div>
      }
    >
      <SignupSentPage />
    </Suspense>
  );
}
