import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureAccountForUser } from "@/lib/auth/ensure-account";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const errorDescription = searchParams.get("error_description");

  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription)}`,
    );
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      await ensureAccountForUser(data.user);
      return NextResponse.redirect(`${origin}${next}`);
    }

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error?.message || "Falha ao confirmar e-mail")}`,
    );
  }

  return NextResponse.redirect(`${origin}/login`);
}
