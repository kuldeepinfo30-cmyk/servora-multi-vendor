/**
 * Small API client for the bits of the demo storefront that need the server:
 * Razorpay order creation and signature verification.
 *
 * The rest of the React app still uses seeded local data on purpose, so if the
 * API is offline the storefront keeps working and falls back to Razorpay's
 * amount-only checkout (see `payments.ts`).
 */

const configuredUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

/** Empty string means "same origin", which is what you want behind a proxy. */
export const API_URL = configuredUrl || (import.meta.env.DEV ? 'http://localhost:4000' : '');

/** The server could not be reached at all (offline or wrong VITE_API_URL). */
export class ApiUnavailable extends Error {
  constructor(message = 'The payments service is unreachable.') {
    super(message);
    this.name = 'ApiUnavailable';
  }
}

/** The server answered with a 4xx/5xx and a structured error. */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface Envelope<T> {
  success?: boolean;
  data?: T;
  error?: { code?: string; message?: string | string[] };
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, timeoutMs = 8_000 } = options;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as Envelope<T> | T | null;

    if (!response.ok) {
      const error = (payload as Envelope<T> | null)?.error;
      const rawMessage = error?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(' ')
        : rawMessage || `Request failed (${response.status}).`;
      throw new ApiError(message, response.status, error?.code);
    }

    if (payload && typeof payload === 'object' && 'success' in payload) {
      return (payload as Envelope<T>).data as T;
    }
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiUnavailable('The payments service took too long to respond.');
    }
    throw new ApiUnavailable(
      error instanceof Error && error.message
        ? `Could not reach the payments service: ${error.message}`
        : undefined,
    );
  } finally {
    window.clearTimeout(timer);
  }
}
