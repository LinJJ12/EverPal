import { getClientId } from "@/utils/clientId";
import { friendlyError } from "@/utils/errors";

const base = () => (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("X-Client-Id", getClientId());
  let res: Response;
  try {
    res = await fetch(`${base()}${path}`, { ...init, headers });
  } catch {
    throw new ApiError("network", "连不上服务器，请确认后端已启动");
  }
  if (!res.ok) {
    let code = "request_error";
    let message = "现在有点忙，稍后再试一下吧";
    try {
      const body = await res.json();
      if (body?.error?.code) code = body.error.code;
      if (body?.error?.message) message = body.error.message;
    } catch {
      /* ignore */
    }
    throw new ApiError(code, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export { friendlyError, base as apiBase };
