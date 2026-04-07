const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    let message = `${res.status} ${res.statusText}`;
    try {
      const json = JSON.parse(body);
      if (json.message) message = json.message;
    } catch {
      if (body) message = body;
    }
    throw new Error(message);
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
