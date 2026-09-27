import { useSyncExternalStore } from 'react';

// Must be the PC's LAN IP on port 3000 (mtaa-api), never localhost or Metro's 8081.
// EXPO_PUBLIC_* values are inlined at bundle time: restart with `npx expo start -c` after editing .env.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');

const TIMEOUT_MS = 15000;

export type ApiErrorKind = 'config' | 'network' | 'timeout' | 'auth' | 'http';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly kind: ApiErrorKind,
    readonly status = 0,
  ) {
    super(message);
  }
}

// Tracks the last successful and failed round-trips so Settings can show reachability.
type ApiHealth = { lastOkAt: number | null; lastError: string | null };
let health: ApiHealth = { lastOkAt: null, lastError: null };
const listeners = new Set<() => void>();

function setHealth(next: Partial<ApiHealth>) {
  health = { ...health, ...next };
  listeners.forEach((l) => l());
}

export function useApiHealth() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => health,
  );
}

function messageFrom(data: unknown, fallback: string) {
  if (data && typeof data === 'object' && 'message' in data) {
    const m = (data as { message: unknown }).message;
    if (Array.isArray(m)) return m.join('\n');
    if (typeof m === 'string' && m) return m;
  }
  return fallback;
}

export async function api<T>(
  path: string,
  opts: { method?: 'GET' | 'POST' | 'PATCH'; body?: unknown; token?: string | null } = {},
): Promise<T> {
  if (!API_URL) {
    throw new ApiError(
      'EXPO_PUBLIC_API_URL is missing. Add it to mtaa/.env and restart Expo with -c.',
      'config',
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method ?? 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch (e) {
    const timedOut = (e as { name?: string })?.name === 'AbortError';
    const err = timedOut
      ? new ApiError('The Mtaa server took too long to answer. Try again.', 'timeout')
      : new ApiError(
          "Can't reach the Mtaa server. Check your data or Wi-Fi and try again.",
          'network',
        );
    setHealth({ lastError: err.message });
    throw err;
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  // Any HTTP answer proves the server is reachable.
  setHealth({ lastOkAt: Date.now(), lastError: null });

  if (res.status === 401) {
    throw new ApiError(
      'Your session has expired. Pull down to retry, or sign out and back in.',
      'auth',
      401,
    );
  }
  if (!res.ok) {
    throw new ApiError(messageFrom(data, `Request failed (${res.status})`), 'http', res.status);
  }
  return data as T;
}

export function errorMessage(e: unknown) {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error && e.message) return e.message;
  return 'Something went wrong. Try again.';
}
