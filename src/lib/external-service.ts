export class ExternalServiceError extends Error {
  constructor(
    public readonly serviceName: string,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ExternalServiceError";
  }
}

function getStatus(error: unknown): number | undefined {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
}

function isRetryable(error: unknown): boolean {
  const status = getStatus(error);
  if (status === undefined) return true; // network/unknown errors — worth a retry
  return status === 429 || status >= 500;
}

/**
 * Single retry/backoff/logging wrapper for every third-party integration
 * (AI, affiliate networks, HubSpot). Never call an external API directly
 * from a service without going through this.
 */
export async function callExternalService<T>(
  serviceName: string,
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 2;
  const baseDelayMs = options.baseDelayMs ?? 300;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const retryable = isRetryable(error);
      console.error(
        `[${serviceName}] attempt ${attempt + 1}/${maxRetries + 1} failed${retryable ? "" : " (not retryable)"}:`,
        error,
      );
      if (!retryable || attempt === maxRetries) break;
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** attempt));
    }
  }

  throw new ExternalServiceError(serviceName, `${serviceName} call failed after retries`, lastError);
}
