function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  supabaseUrl: () =>
    required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: () =>
    required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  supabaseServiceRoleKey: () =>
    required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
  asaasApiKey: () => {
    // Remove aspas residuais e espaços; chave Assas sempre começa com $aact
    let key = (process.env.ASAAS_API_KEY ?? "").trim().replace(/^['"]|['"]$/g, "");
    if (!key) {
      throw new Error("Missing environment variable: ASAAS_API_KEY");
    }
    // Se o $ inicial foi expandido/perdido, tenta recuperar o token restante
    if (!key.startsWith("$") && key.startsWith("aact_")) {
      key = `$${key}`;
    }
    if (!key.startsWith("$aact")) {
      throw new Error(
        "ASAAS_API_KEY inválida. No .env.local use: ASAAS_API_KEY=\\$aact_... e reinicie o servidor.",
      );
    }
    return key;
  },
  asaasApiUrl: () =>
    process.env.ASAAS_API_URL ?? "https://api-sandbox.asaas.com/v3",
  asaasWebhookToken: () => process.env.ASAAS_WEBHOOK_TOKEN ?? "",
  stalwartApiUrl: () => process.env.STALWART_API_URL ?? "",
  stalwartApiUser: () => process.env.STALWART_API_USER ?? "",
  stalwartApiPassword: () => process.env.STALWART_API_PASSWORD ?? "",
  webmailUrl: () =>
    process.env.NEXT_PUBLIC_WEBMAIL_URL ?? "https://webmail.webgeele.com.br",
};
