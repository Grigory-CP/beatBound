export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function isRefreshExempt(path: string) {
  return (
    path === "/api/auth/login" ||
    path.startsWith("/api/auth/signup/") ||
    path === "/api/auth/refresh"
  );
}

async function refreshSession() {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function readJsonBody(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  try {
    const response = await fetch(path, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {})
      },
      ...options
    });

    if (response.status === 401 && retry && !isRefreshExempt(path)) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return apiFetch<T>(path, options, false);
      }
    }

    if (!response.ok) {
      const body = await readJsonBody(response);
      throw new ApiError(
        response.status,
        body.error ?? "server_error",
        body.message ?? "Something went wrong"
      );
    }

    const body = await readJsonBody(response);
    return (body as T) ?? ({} as T);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, "network_error", "Can't reach the server.");
  }
}
