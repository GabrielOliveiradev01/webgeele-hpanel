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
  let response: Response;
  try {
    response = await fetch(`${env.transferWorkerUrl()}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${env.transferWorkerToken()}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // Não propaga a mensagem original: pode conter a URL ou detalhes internos.
    throw new WorkerError("Serviço de migração indisponível. Tente novamente em instantes.", 503);
  }

  const body = (await response.json().catch(() => ({}))) as T & {
    error?: string;
    migrationId?: string;
  };

  if (!response.ok) {
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
