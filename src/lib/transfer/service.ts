import { createAdminClient } from "@/lib/supabase/admin";
import {
  createTransferWorkerClient,
  WorkerError,
  type WorkerJob,
  type WorkerProgress,
  type WorkerStatus,
} from "@/lib/transfer/client";
import { getMigrationProvider } from "@/lib/transfer/providers";

/** Tentativas (testes + cópias) permitidas por conta numa janela de 1 hora. */
export const ATTEMPTS_PER_HOUR = 10;
/** Validade de um teste de conexão bem-sucedido para liberar a cópia. */
const CHECK_VALID_MINUTES = 30;
/** Intervalo mínimo entre consultas ao Worker para a mesma migração. */
const REFRESH_INTERVAL_MS = 2_000;

const ACTIVE: WorkerStatus[] = ["pending", "running"];

export class MigrationError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly migrationId?: string,
  ) {
    super(message);
  }
}

type MigrationRow = {
  id: string;
  account_id: string;
  mailbox_id: string | null;
  kind: "check" | "sync";
  provider: string;
  source_host: string;
  source_email: string;
  destination_email: string;
  worker_job_id: string | null;
  status: WorkerStatus;
  progress: WorkerProgress;
  error_code: string | null;
  error_message: string | null;
  exit_code: number | null;
  started_at: string | null;
  finished_at: string | null;
  last_synced_at: string | null;
  created_at: string;
};

/** O que o navegador recebe: sem senhas e sem o id da tarefa no Worker. */
export type MigrationView = {
  id: string;
  kind: "check" | "sync";
  status: WorkerStatus;
  provider: string;
  sourceEmail: string;
  destinationEmail: string;
  mailboxId: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  progress: {
    phase: string | null;
    currentFolder: string | null;
    foldersTotal: number | null;
    foldersDone: number | null;
    sourceMessages: number | null;
    processed: number | null;
    total: number | null;
    percent: number | null;
    copied: number | null;
    skipped: number | null;
    errors: number | null;
  };
  error: { code: string; message: string } | null;
};

const COLUMNS =
  "id, account_id, mailbox_id, kind, provider, source_host, source_email, destination_email, worker_job_id, status, progress, error_code, error_message, exit_code, started_at, finished_at, last_synced_at, created_at";

// Mensagens próprias do painel para os erros mais comuns do Worker.
const FRIENDLY_ERRORS: Record<string, string> = {
  source_auth_failed: "E-mail ou senha da conta de origem incorretos.",
  destination_auth_failed:
    "Senha da caixa WebGeele incorreta. Se não lembrar, redefina-a em Caixas de entrada.",
  source_unreachable: "Não foi possível conectar ao servidor de origem.",
  destination_unreachable: "Não foi possível conectar ao servidor WebGeele.",
  destination_quota: "A caixa WebGeele está sem espaço. Aumente o plano da caixa e tente novamente.",
  interrupted: "A migração foi interrompida. Inicie novamente; mensagens já copiadas não serão duplicadas.",
  timeout: "A migração excedeu o tempo máximo. Inicie novamente para continuar de onde parou.",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@"'<>\\,;]{1,64}@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);

function toView(row: MigrationRow): MigrationView {
  const p = row.progress ?? {};
  const summary = p.summary ?? {};
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    provider: row.provider,
    sourceEmail: row.source_email,
    destinationEmail: row.destination_email,
    mailboxId: row.mailbox_id,
    createdAt: row.created_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    progress: {
      phase: typeof p.phase === "string" ? p.phase : null,
      currentFolder: typeof p.currentFolder === "string" ? p.currentFolder : null,
      foldersTotal: num(p.foldersTotal),
      foldersDone: num(p.foldersDone),
      sourceMessages: num(p.sourceMessages),
      processed: num(p.processed),
      total: num(p.total),
      percent: num(p.percent),
      copied: num(summary.transferred) ?? num(p.copied),
      skipped: num(summary.skipped),
      errors: num(p.errors),
    },
    error: row.error_code
      ? { code: row.error_code, message: row.error_message ?? "A migração não foi concluída." }
      : null,
  };
}

function jobUpdate(job: WorkerJob) {
  const code = job.error?.code ?? null;
  return {
    status: job.status,
    progress: job.progress ?? {},
    error_code: code,
    error_message: code ? (FRIENDLY_ERRORS[code] ?? job.error?.message ?? null) : null,
    exit_code: job.exitCode,
    started_at: job.startedAt,
    finished_at: job.finishedAt,
    last_synced_at: new Date().toISOString(),
  };
}

function readEmail(value: unknown, label: string) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL.test(email)) {
    throw new MigrationError(`Informe um e-mail válido para ${label}.`);
  }
  return email;
}

function readPassword(value: unknown, label: string) {
  if (typeof value !== "string" || value.length === 0) {
    throw new MigrationError(`Informe a senha da ${label}.`);
  }
  if (value.length > 1024 || /[\r\n\0]/.test(value)) {
    throw new MigrationError(`A senha da ${label} contém caracteres inválidos.`);
  }
  return value;
}

export async function listMigrations(accountId: string, limit = 30) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mail_migrations")
    .select(COLUMNS)
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as MigrationRow[]).map(toView);
}

async function refreshFromWorker(row: MigrationRow): Promise<MigrationRow> {
  if (!row.worker_job_id) return row;
  const admin = createAdminClient();
  let update: Partial<MigrationRow>;
  try {
    update = jobUpdate(await createTransferWorkerClient().getMigration(row.worker_job_id));
  } catch (error) {
    if (!(error instanceof WorkerError) || error.status !== 404) return row; // falha temporária
    update = {
      status: "failed",
      error_code: "worker_lost",
      error_message:
        "A tarefa não foi encontrada no serviço de migração. Inicie novamente; mensagens já copiadas não serão duplicadas.",
      finished_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
    };
  }
  const { data, error } = await admin
    .from("mail_migrations")
    .update(update)
    .eq("id", row.id)
    .eq("account_id", row.account_id)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data as MigrationRow;
}

/** Devolve a migração só se pertencer à conta; atualiza o progresso a partir do Worker. */
export async function getMigration(accountId: string, id: string) {
  if (!UUID.test(id)) return null;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mail_migrations")
    .select(COLUMNS)
    .eq("id", id)
    .eq("account_id", accountId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  let row = data as MigrationRow;
  const stale =
    !row.last_synced_at || Date.now() - Date.parse(row.last_synced_at) >= REFRESH_INTERVAL_MS;
  if (ACTIVE.includes(row.status) && stale) row = await refreshFromWorker(row);
  return toView(row);
}

export type StartMigrationInput = {
  accountId: string;
  userId: string;
  kind: unknown;
  provider: unknown;
  sourceEmail: unknown;
  sourcePassword: unknown;
  mailboxId: unknown;
  destinationPassword: unknown;
};

/**
 * Inicia um teste de conexão (check) ou uma cópia (sync). As senhas recebidas
 * só são repassadas ao Worker neste pedido e nunca são gravadas.
 */
export async function startMigration(input: StartMigrationInput): Promise<MigrationView> {
  const kind = input.kind === "sync" ? "sync" : input.kind === "check" ? "check" : null;
  if (!kind) throw new MigrationError("Tipo de operação inválido.");

  const provider = typeof input.provider === "string" ? getMigrationProvider(input.provider) : null;
  if (!provider) throw new MigrationError("Selecione o provedor de origem.");

  const sourceEmail = readEmail(input.sourceEmail, "a conta de origem");
  const sourcePassword = readPassword(input.sourcePassword, "conta de origem");
  const destinationPassword = readPassword(input.destinationPassword, "caixa WebGeele");
  const mailboxId = typeof input.mailboxId === "string" && UUID.test(input.mailboxId) ? input.mailboxId : null;
  if (!mailboxId) throw new MigrationError("Selecione a caixa de destino.");

  const admin = createAdminClient();

  // A caixa de destino tem de ser da conta do cliente e estar ativa.
  const { data: mailbox, error: mailboxError } = await admin
    .from("mailboxes")
    .select("id, email, status")
    .eq("id", mailboxId)
    .eq("account_id", input.accountId)
    .neq("status", "deleted")
    .maybeSingle();
  if (mailboxError) throw mailboxError;
  if (!mailbox) throw new MigrationError("Caixa de destino não encontrada.", 404);
  if (mailbox.status !== "active") {
    throw new MigrationError("A caixa de destino não está ativa. Regularize a assinatura e tente novamente.", 409);
  }

  if (kind === "sync") {
    const validSince = new Date(Date.now() - CHECK_VALID_MINUTES * 60_000).toISOString();
    const { data: check } = await admin
      .from("mail_migrations")
      .select("id")
      .eq("account_id", input.accountId)
      .eq("mailbox_id", mailbox.id)
      .eq("kind", "check")
      .eq("status", "completed")
      .eq("source_host", provider.host)
      .eq("source_email", sourceEmail)
      .gte("finished_at", validSince)
      .limit(1)
      .maybeSingle();
    if (!check) {
      throw new MigrationError("Teste a conexão antes de iniciar a migração.", 409);
    }

    const { data: active } = await admin
      .from("mail_migrations")
      .select("id")
      .eq("account_id", input.accountId)
      .eq("mailbox_id", mailbox.id)
      .eq("kind", "sync")
      .in("status", ACTIVE)
      .limit(1)
      .maybeSingle();
    if (active) {
      throw new MigrationError("Já existe uma migração em andamento para esta caixa.", 409, active.id);
    }
  }

  // Regista a tentativa antes de contactar o Worker: assim todas contam para o limite.
  const { data: inserted, error: insertError } = await admin
    .from("mail_migrations")
    .insert({
      account_id: input.accountId,
      mailbox_id: mailbox.id,
      created_by: input.userId,
      kind,
      provider: provider.id,
      source_host: provider.host,
      source_email: sourceEmail,
      destination_email: mailbox.email,
      status: "pending",
    })
    .select(COLUMNS)
    .single();
  if (insertError) {
    if (insertError.code === "23505") {
      throw new MigrationError("Já existe uma migração em andamento para esta caixa.", 409);
    }
    throw insertError;
  }
  const row = inserted as MigrationRow;

  // Limite por conta. Contar depois de inserir evita que pedidos simultâneos
  // ultrapassem o limite; o pedido recusado é removido para não alongar o bloqueio.
  const since = new Date(Date.now() - 60 * 60_000).toISOString();
  const { count, error: countError } = await admin
    .from("mail_migrations")
    .select("id", { count: "exact", head: true })
    .eq("account_id", input.accountId)
    .gte("created_at", since);
  if (countError) throw countError;
  if ((count ?? 0) > ATTEMPTS_PER_HOUR) {
    await admin.from("mail_migrations").delete().eq("id", row.id).eq("account_id", input.accountId);
    throw new MigrationError(
      `Limite de ${ATTEMPTS_PER_HOUR} tentativas por hora atingido. Tente novamente mais tarde.`,
      429,
    );
  }

  let update: Partial<MigrationRow> & { worker_job_id?: string };
  try {
    const job = await createTransferWorkerClient().startMigration({
      source: { host: `${provider.host}:${provider.port}`, email: sourceEmail, password: sourcePassword },
      destination: { email: mailbox.email, password: destinationPassword },
      checkOnly: kind === "check",
    });
    update = { ...jobUpdate(job), worker_job_id: job.id };
  } catch (error) {
    const workerError = error instanceof WorkerError ? error : null;
    update = {
      status: "failed",
      finished_at: new Date().toISOString(),
      error_code:
        workerError?.status === 409 ? "already_running" : workerError?.status === 400 ? "invalid_request" : "worker_unavailable",
      error_message:
        workerError?.status === 409
          ? "Já existe uma migração em andamento para estas contas."
          : workerError?.status === 400
            ? workerError.message
            : "Serviço de migração indisponível. Tente novamente em instantes.",
    };
    if (!workerError) console.error("[migrations] falha ao contactar o Worker", (error as Error)?.name);
  }

  const { data: saved, error: saveError } = await admin
    .from("mail_migrations")
    .update(update)
    .eq("id", row.id)
    .eq("account_id", input.accountId)
    .select(COLUMNS)
    .single();
  if (saveError) throw saveError;
  return toView(saved as MigrationRow);
}
