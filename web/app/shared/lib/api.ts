import { getSupabase } from "./supabase";
import { env } from "./env";

type ApiOptions = RequestInit & {
  json?: unknown;
  skipAuth?: boolean;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api<T = unknown>(
  path: string,
  opts: ApiOptions = {},
): Promise<T> {
  const { json, skipAuth, headers, ...rest } = opts;

  const auth = skipAuth ? {} : await authHeader();

  const init: RequestInit = {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...auth,
      ...(headers as Record<string, string> | undefined),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  };

  const url = path.startsWith("http") ? path : `${env.API_URL}${path}`;
  const res = await fetch(url, init);

  if (!res.ok) {
    let payload: unknown = undefined;
    try {
      payload = await res.json();
    } catch {
      // ignore
    }
    const detail =
      (payload as { detail?: string } | undefined)?.detail ?? res.statusText;
    throw new ApiError(res.status, detail || `Request failed: ${res.status}`, payload);
  }

  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

export async function apiUpload<T = unknown>(
  path: string,
  form: FormData,
): Promise<T> {
  const auth = await authHeader();
  const url = path.startsWith("http") ? path : `${env.API_URL}${path}`;
  const res = await fetch(url, {
    method: "POST",
    body: form,
    headers: { ...auth },
  });
  if (!res.ok) {
    let payload: unknown = undefined;
    try { payload = await res.json(); } catch {}
    const detail = (payload as { detail?: string } | undefined)?.detail ?? res.statusText;
    throw new ApiError(res.status, detail, payload);
  }
  return (await res.json()) as T;
}
