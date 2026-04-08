import { get, post, API_BASE_URL } from "./api";
import type { AuthSession } from "../types/AuthSession";

export function getSession(): Promise<AuthSession> {
  return get<AuthSession>("/api/auth/me");
}

export function login(email: string, password: string): Promise<AuthSession> {
  return post<AuthSession>("/api/auth/login", { email, password });
}

export function logout(): Promise<{ message: string }> {
  return post<{ message: string }>("/api/auth/logout");
}

export function register(
  email: string,
  password: string
): Promise<AuthSession> {
  return post<AuthSession>("/api/auth/register", { email, password });
}

export function getGoogleLoginUrl(returnPath: string = "/"): string {
  return `${API_BASE_URL}/api/auth/external-login?provider=Google&returnPath=${encodeURIComponent(returnPath)}`;
}
