export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

function extractErrorMessage(body: string, fallback: string): string {
  if (!body) return fallback;
  try {
    const json = JSON.parse(body) as {
      message?: unknown;
      title?: unknown;
      detail?: unknown;
      errors?: Record<string, unknown>;
    };

    if (typeof json.message === "string" && json.message.trim()) {
      return json.message.trim();
    }

    const validationErrors =
      json.errors && typeof json.errors === "object"
        ? Object.values(json.errors)
            .flatMap((value) => (Array.isArray(value) ? value : [value]))
            .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        : [];

    if (validationErrors.length > 0) {
      return validationErrors.join(" ");
    }

    const parts = [json.title, json.detail].filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0,
    );
    if (parts.length > 0) {
      return parts.join(" — ");
    }
  } catch {
    return body || fallback;
  }

  return body || fallback;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    const message = extractErrorMessage(body, `${res.status} ${res.statusText}`);
    throw new Error(message);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const contentLength = res.headers.get("Content-Length");
  if (contentLength === "0") {
    return undefined as T;
  }
  const contentType = res.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    const body = await res.text();
    return body as T;
  }
  return res.json() as Promise<T>;
}

export function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  return fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  }).then((res) => handleResponse<T>(res));
}

export function get<T>(path: string): Promise<T> {
  return api<T>(path, { method: "GET" });
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return api<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function put<T>(path: string, body?: unknown): Promise<T> {
  return api<T>(path, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function del<T>(path: string): Promise<T> {
  if (!window.confirm("Are you sure you want to delete this record? This action cannot be undone.")) {
    return Promise.reject(new Error("Delete cancelled by user"));
  }
  return api<T>(path, { method: "DELETE" });
}
