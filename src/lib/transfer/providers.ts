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
];

export function getMigrationProvider(id: string) {
  return MIGRATION_PROVIDERS.find((provider) => provider.id === id) ?? null;
}
