import { generateApiKey } from "./crypto.js";
import { KrsApiError, KrsAuthError, KrsNetworkError } from "./errors.js";
import type { KrsClient, KrsConfig, RetryOptions } from "./types.js";

const DEFAULT_CONFIG: KrsConfig = {
  officialApiBaseUrl: "https://api-krs.ms.gov.pl/api/krs",
  wyszukiwarkaBaseUrl: "https://wyszukiwarka-krs-api.ms.gov.pl/api/wyszukiwarka",
  terytAdvancedBaseUrl: "https://wyszukiwarka-krs.ms.gov.pl/api/terytwkrs/Teryt",
  apiKeyHeader: "TopSecretApiKey",
  secretKey: "TopSecretApiKey1",
  timeoutMs: 15_000,
  rateLimitPerSecond: 2,
  fetchImpl: fetch
};

function joinUrl(base: string, path: string): string {
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class HostRateLimiter {
  private readonly hostChains = new Map<string, Promise<void>>();
  private readonly nextAllowed = new Map<string, number>();

  constructor(private readonly requestsPerSecond: number) {}

  async acquire(url: string): Promise<void> {
    const host = new URL(url).host;
    const previous = this.hostChains.get(host) ?? Promise.resolve();
    const interval = Math.max(1, Math.ceil(1000 / this.requestsPerSecond));

    const next = previous.then(async () => {
      const now = Date.now();
      const earliest = this.nextAllowed.get(host) ?? now;
      const waitMs = Math.max(0, earliest - now);
      if (waitMs > 0) {
        await sleep(waitMs);
      }
      const executionTime = Date.now();
      this.nextAllowed.set(host, executionTime + interval);
    });

    this.hostChains.set(host, next.catch(() => undefined));
    await next;
  }
}

function parseResponseBody(text: string): unknown {
  if (!text.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

interface RequestOptions {
  method: "GET" | "POST";
  url: string;
  headers?: Record<string, string>;
  body?: object;
  retry401?: boolean;
}

export function createKrsClient(config: Partial<KrsConfig> = {}): KrsClient {
  const mergedConfig: KrsConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    fetchImpl: config.fetchImpl ?? DEFAULT_CONFIG.fetchImpl
  };

  const limiter = new HostRateLimiter(mergedConfig.rateLimitPerSecond);

  async function request<T>(options: RequestOptions): Promise<T> {
    const maxRetries = 2;
    const backoff = [200, 500];

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      await limiter.acquire(options.url);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), mergedConfig.timeoutMs);

      let response: Response;
      try {
        response = await mergedConfig.fetchImpl(options.url, {
          method: options.method,
          headers: options.headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal
        });
      } catch (error) {
        clearTimeout(timer);

        if (attempt < maxRetries) {
          await sleep(backoff[attempt] ?? 500);
          continue;
        }

        const isAbort = error instanceof Error && error.name === "AbortError";
        throw new KrsNetworkError(
          isAbort
            ? `Request timed out after ${mergedConfig.timeoutMs}ms`
            : "Failed to reach upstream API",
          error
        );
      }

      clearTimeout(timer);

      const text = await response.text();
      const parsed = parseResponseBody(text);

      if (response.status === 204) {
        return undefined as T;
      }

      if (!response.ok) {
        if (response.status === 401 && options.retry401 && attempt === 0) {
          continue;
        }

        if (response.status >= 500 && attempt < maxRetries) {
          await sleep(backoff[attempt] ?? 500);
          continue;
        }

        const message =
          typeof parsed === "object" && parsed !== null && "title" in parsed
            ? String((parsed as Record<string, unknown>).title)
            : `Request failed with HTTP ${response.status}`;

        if (response.status === 401) {
          throw new KrsAuthError(message, response.status, options.url, parsed);
        }

        throw new KrsApiError(message, response.status, options.url, parsed);
      }

      return parsed as T;
    }

    throw new KrsNetworkError("Unexpected retry exhaustion");
  }

  return {
    config: mergedConfig,

    async officialApiGet<T>(path: string): Promise<T> {
      return request<T>({
        method: "GET",
        url: joinUrl(mergedConfig.officialApiBaseUrl, path)
      });
    },

    async wyszukiwarkaPost<T>(path: string, body: object, retryOptions?: RetryOptions): Promise<T> {
      return request<T>({
        method: "POST",
        url: joinUrl(mergedConfig.wyszukiwarkaBaseUrl, path),
        headers: {
          "Content-Type": "application/json",
          apiKey: generateApiKey(),
          "x-api-key": mergedConfig.apiKeyHeader
        },
        body,
        retry401: retryOptions?.retry401 ?? true
      });
    },

    async terytBasicPost<T>(path: string, body: object, retryOptions?: RetryOptions): Promise<T> {
      return request<T>({
        method: "POST",
        url: joinUrl(mergedConfig.wyszukiwarkaBaseUrl, path),
        headers: {
          "Content-Type": "application/json",
          apiKey: generateApiKey(),
          "x-api-key": mergedConfig.apiKeyHeader
        },
        body,
        retry401: retryOptions?.retry401 ?? true
      });
    },

    async terytAdvancedGet<T>(path: string, params?: Record<string, string>): Promise<T> {
      const url = new URL(joinUrl(mergedConfig.terytAdvancedBaseUrl, path));
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value.length > 0) {
            url.searchParams.set(key, value);
          }
        }
      }

      return request<T>({
        method: "GET",
        url: url.toString()
      });
    },

    async terytAdvancedPost<T>(path: string, body: object): Promise<T> {
      return request<T>({
        method: "POST",
        url: joinUrl(mergedConfig.terytAdvancedBaseUrl, path),
        headers: {
          "Content-Type": "application/json"
        },
        body
      });
    }
  };
}
