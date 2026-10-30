import { SignupForm } from "@/components/signup-form";

export default function CadastroPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(113,89,233,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(230,106,175,0.16),transparent_30%),#f6f4fb] px-4 py-10">
      <SignupForm />
    </div>
  );
}
