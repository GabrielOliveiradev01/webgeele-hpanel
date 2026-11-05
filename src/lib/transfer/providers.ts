// Provedores de origem aceitos na migração. O host também precisa estar em
// SOURCE_HOSTS no Worker, que recusa qualquer servidor fora da sua lista.
export type MigrationProvider = {
  id: string;
  label: string;
  host: string;
  port: number;
  hint: string;
};

export const MIGRATION_PROVIDERS: MigrationProvider[] = [
  {
    id: "hostinger",
    label: "Hostinger",
    host: "imap.hostinger.com",
    port: 993,
    hint: "Use o e-mail completo e a senha da caixa na Hostinger.",
  },
  {
    id: "locaweb",
    label: "Locaweb",
    host: "email-ssl.com.br",
    port: 993,
    hint: "Use o e-mail completo e a senha da caixa na Locaweb.",
  },
  {
    id: "kinghost",
    label: "KingHost",
    host: "imap.kinghost.net",
    port: 993,
    hint: "Use o e-mail completo e a senha da caixa na KingHost.",
  },
  {
    id: "titan",
    label: "Titan (HostGator)",
    host: "imap.titan.email",
    port: 993,
    hint: "Use o e-mail completo e a senha do Titan, o e-mail da HostGator.",
  },
  {
    id: "godaddy",
    label: "GoDaddy",
    host: "imap.secureserver.net",
    port: 993,
    hint: "Use o e-mail completo e a senha da caixa na GoDaddy.",
  },
  {
    id: "umbler",
    label: "Umbler",
    host: "imap.umbler.com",
    port: 993,
    hint: "Use o e-mail completo e a senha da caixa na Umbler.",
  },
  {
    id: "zoho",
    label: "Zoho Mail",
    host: "imappro.zoho.com",
    port: 993,
    hint: "Ative o acesso IMAP em Configurações do Zoho Mail e use o e-mail completo e a senha (ou senha de app, se tiver 2 etapas).",
  },
  {
    id: "uol",
    label: "UOL Mail (@uol.com.br)",
    host: "imap.uol.com.br",
    port: 993,
    hint: "Use o e-mail @uol.com.br completo e a senha da conta UOL.",
  },
  {
    id: "gmail",
    label: "Gmail / Google Workspace",
    host: "imap.gmail.com",
    port: 993,
    hint: "Use o e-mail completo e uma senha de app (gerada com a verificação em 2 etapas ativa); a senha normal não funciona.",
  },
  {
    id: "yahoo",
    label: "Yahoo Mail",
    host: "imap.mail.yahoo.com",
    port: 993,
    hint: "Use o e-mail completo e uma senha de app (gerada com a verificação em 2 etapas ativa); a senha normal não funciona.",
  },
  {
    id: "icloud",
    label: "iCloud Mail",
    host: "imap.mail.me.com",
    port: 993,
    hint: "Use o e-mail completo e uma senha de app (gerada com a verificação em 2 etapas ativa); a senha normal não funciona.",
  },
];

export function getMigrationProvider(id: string) {
  return MIGRATION_PROVIDERS.find((provider) => provider.id === id) ?? null;
}
