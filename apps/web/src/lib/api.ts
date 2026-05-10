import type { AuthSuccess, ApiError, User } from '@psich/types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiCallError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown> | undefined;
  constructor(status: number, payload: ApiError) {
    super(payload.message);
    this.status = status;
    this.code = payload.code;
    this.details = payload.details;
  }
}

let accessToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function tryRefresh(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = (await res.json()) as AuthSuccess;
      accessToken = data.accessToken;
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

interface ApiOpts extends RequestInit {
  json?: unknown;
  auth?: boolean;
  retryOn401?: boolean;
}

export async function apiFetch<T>(path: string, opts: ApiOpts = {}): Promise<T> {
  const { json, auth = true, retryOn401 = true, headers, body, ...rest } = opts;
  const init: RequestInit = {
    ...rest,
    credentials: 'include',
    headers: {
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(headers as Record<string, string> | undefined),
    },
    body: json !== undefined ? JSON.stringify(json) : (body as BodyInit | undefined),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, init);

  if (res.status === 401 && auth && retryOn401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch<T>(path, { ...opts, retryOn401: false });
    }
  }

  if (res.status === 204) return undefined as unknown as T;

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    const err = (payload as { error?: ApiError } | null)?.error ?? {
      code: 'NETWORK_ERROR',
      message: res.statusText || 'Request failed',
    };
    throw new ApiCallError(res.status, err);
  }
  return payload as T;
}

export const auth = {
  register: (input: { email: string; name: string; password: string }) =>
    apiFetch<AuthSuccess>('/api/auth/register', { method: 'POST', json: input, auth: false }),
  login: (input: { email: string; password: string }) =>
    apiFetch<AuthSuccess>('/api/auth/login', { method: 'POST', json: input, auth: false }),
  refresh: () => apiFetch<AuthSuccess>('/api/auth/refresh', { method: 'POST', auth: false }),
  logout: () => apiFetch<void>('/api/auth/logout', { method: 'POST', auth: false }),
  me: () => apiFetch<{ user: User }>('/api/auth/me'),
};
