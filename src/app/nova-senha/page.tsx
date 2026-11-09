import type { Metadata } from "next";
import { NewPasswordForm } from "@/components/password-reset-forms";

export const metadata: Metadata = {
  title: "Nova senha",
  robots: { index: false, follow: false },
};

// Só chega aqui quem abriu o link do e-mail: /auth/confirm cria a sessão e o proxy exige login.
export default function NovaSenhaPage() {
  return <NewPasswordForm />;
}
