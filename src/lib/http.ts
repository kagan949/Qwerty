export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url?: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

interface FetchJsonOptions {
  timeoutMs?: number;
  retries?: number;
  headers?: Record<string, string>;
  /** Next.js fetch cache revalidation window in seconds. 0 = no store. */
  revalidate?: number;
  signal?: AbortSignal;
}

const USER_AGENT = "VYBE/1.0 (+https://github.com/kagan949/Qwerty; music discovery app)";

export async function fetchJson<T = unknown>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const { timeoutMs = 8000, retries = 1, headers = {}, revalidate = 300, signal } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    signal?.addEventListener("abort", onAbort, { once: true });
    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          "user-agent": USER_AGENT,
          ...headers,
        },
        signal: controller.signal,
        next: revalidate > 0 ? { revalidate } : undefined,
        cache: revalidate > 0 ? undefined : "no-store",
      });
      if (!response.ok) {
        throw new HttpError(`Upstream responded ${response.status}`, response.status, url);
      }
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      const status = error instanceof HttpError ? error.status : 0;
      // Don't waste retries on client errors
      if (status >= 400 && status < 500) break;
      if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Network request failed");
}

export async function fetchText(url: string, options: FetchJsonOptions = {}): Promise<string> {
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT, ...options.headers },
    signal: options.signal,
  });
  if (!response.ok) throw new HttpError(`Upstream responded ${response.status}`, response.status, url);
  return response.text();
}
