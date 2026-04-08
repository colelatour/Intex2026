import { useState, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { login, register, getGoogleLoginUrl } from "../lib/authApi";
import { MIN_PASSWORD_LENGTH, isPasswordLongEnough, passwordMinLengthMessage } from "../lib/passwordPolicy";
import "../styles/Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const externalError = searchParams.get("error");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(externalError || "");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function friendlyError(raw: string): string {
    const lower = raw.toLowerCase();
    if (lower.includes("invalid email or password") || lower.includes("unauthorized"))
      return "The email or password you entered is incorrect. Please try again.";
    if (lower.includes("is already taken"))
      return "An account with this email already exists. Try logging in instead.";
    if (lower.includes("must be at least") && lower.includes("character"))
      return passwordMinLengthMessage();
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

    if (mode === "register" && !isPasswordLongEnough(password)) {
      setError(passwordMinLengthMessage());
      return;
    }

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
                minLength={mode === "register" ? MIN_PASSWORD_LENGTH : undefined}
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

        <div className="login-divider">
          <span>or</span>
        </div>

        <a href={getGoogleLoginUrl(redirectTo)} className="login-google-btn">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.42l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </a>
      </div>
    </div>
  );
}
