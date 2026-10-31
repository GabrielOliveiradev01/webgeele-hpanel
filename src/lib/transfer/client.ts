import { env } from "@/lib/env";

// Cliente HTTP do WebGeele Transfer Worker. Só é usado no servidor: o token e
// as senhas nunca passam pelo navegador além do formulário do próprio cliente.

export type WorkerStatus = "pending" | "running" | "completed" | "failed";

export type WorkerProgress = {
  phase?: string;
  currentFolder?: string | null;
  foldersTotal?: number | null;
  foldersDone?: number;
  sourceMessages?: number | null;
  processed?: number | null;
  total?: number | null;
  percent?: number | null;
  copied?: number;
  errors?: number;
  summary?: Record<string, number> | null;
};

export type WorkerJob = {
  id: string;
  status: WorkerStatus;
  kind: "check" | "sync";
  startedAt: string | null;
  finishedAt: string | null;
  progress: WorkerProgress;
  error: { code: string; message: string } | null;
  exitCode: number | null;
};

export type WorkerAccount = {
  /** Omitido no destino: o Worker usa o servidor WebGeele configurado nele. */
  host?: string;
  email: string;
  password: string;
};

export class WorkerError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly existingJobId?: string,
  ) {
    super(message);
  }
}

const TIMEOUT_MS = 15_000;

async function workerFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let baseUrl: string;
  let token: string;
  try {
    baseUrl = env.transferWorkerUrl();
    token = env.transferWorkerToken();
  } catch (error) {
    // Mensagem de configuração (nome da variável em falta), sem valores.
    console.error(`[transfer] configuração inválida: ${(error as Error).message}`);
    throw new WorkerError("Serviço de migração não configurado.", 503);
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    // Ao cliente não vai a mensagem original; no log fica só o tipo do erro.
    const cause = (error as Error & { cause?: { code?: string } })?.cause?.code ?? (error as Error)?.name;
    console.error(`[transfer] Worker inacessível (${cause})`);
    throw new WorkerError("Serviço de migração indisponível. Tente novamente em instantes.", 503);
  }

  const body = (await response.json().catch(() => ({}))) as T & {
    error?: string;
    migrationId?: string;
  };

  if (!response.ok) {
    if (response.status === 401 || response.status === 429 || response.status >= 500) {
      console.error(`[transfer] Worker respondeu HTTP ${response.status} em ${init?.method ?? "GET"} ${path.split("/").slice(0, 2).join("/")}`);
    }
    throw new WorkerError(
      typeof body.error === "string" ? body.error : `Worker respondeu ${response.status}`,
      response.status,
      body.migrationId,
    );
  }
  return body;
}

export function createTransferWorkerClient() {
  return {
    /** Cria a tarefa no Worker. As senhas seguem apenas neste pedido HTTPS. */
    startMigration(input: { source: WorkerAccount; destination: WorkerAccount; checkOnly: boolean }) {
      return workerFetch<WorkerJob>("/migrations", {
        method: "POST",
        body: JSON.stringify({
          source: input.source,
          destination: input.destination,
          checkOnly: input.checkOnly,
        }),
      });
    },

    getMigration(jobId: string) {
      return workerFetch<WorkerJob>(`/migrations/${encodeURIComponent(jobId)}`);
    },
  };
}
