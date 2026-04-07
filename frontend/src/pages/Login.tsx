import { useState, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { login, register } from "../lib/authApi";
import "../styles/Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function friendlyError(raw: string): string {
    const lower = raw.toLowerCase();
    if (lower.includes("invalid email or password") || lower.includes("unauthorized"))
      return "The email or password you entered is incorrect. Please try again.";
    if (lower.includes("is already taken"))
      return "An account with this email already exists. Try logging in instead.";
    if (lower.includes("must be at least") && lower.includes("character"))
      return "Your password must be at least 14 characters long.";
    if (lower.includes("network") || lower.includes("failed to fetch"))
      return "Unable to connect to the server. Please check your internet connection and try again.";
    if (lower.includes("500") || lower.includes("internal server"))
      return "Something went wrong on our end. Please try again in a moment.";
    if (raw.includes(";")) {
      return raw
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean)
        .join(" ");
    }
    return raw || "Something went wrong. Please try again.";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate(redirectTo);
    } catch (err: any) {
      setError(friendlyError(err.message || ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Sheltered<span style={{ color: "var(--gold)" }}>Light</span></h2>

        <div className="login-tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Login
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => { setMode("register"); setError(""); }}
          >
            Register
          </button>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <div className="login-password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "..." : mode === "login" ? "Login" : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
