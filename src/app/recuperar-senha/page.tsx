import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/password-reset-forms";

export const metadata: Metadata = {
  title: "Recuperar senha",
  robots: { index: false, follow: false },
};

export default function RecuperarSenhaPage() {
  return <ForgotPasswordForm />;
}
