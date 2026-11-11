import { Suspense } from "react";
import type { Metadata } from "next";
import { SignupExistsPage } from "@/components/signup-result";

export const metadata: Metadata = {
  title: "E-mail já cadastrado",
  robots: { index: false, follow: false },
};

export default function CadastroJaExistePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-wg-text-muted">
          Carregando...
        </div>
      }
    >
      <SignupExistsPage />
    </Suspense>
  );
}
