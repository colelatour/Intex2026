import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getSession, logout } from "../../lib/authApi";
import type { AuthSession } from "../../types/AuthSession";
import "../../styles/Navbar.css";

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    getSession().then(setSession).catch(() => setSession(null));
  }, [pathname]);

  async function handleLogout() {
    await logout();
    setSession(null);
    navigate("/");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__logo">
        <div className="navbar__logo-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        Safe<span>Haven</span>
      </Link>

      <ul className="navbar__links">
        <li>
          <Link to="/" className={pathname === "/" ? "active" : ""}>
            Home
          </Link>
        </li>
        <li>
          <Link to="/" className="">
            Our Mission
          </Link>
        </li>
        <li>
          <Link to="/impact" className={pathname === '/impact' ? 'active' : ''}>
            Impact
          </Link>
        </li>
        <li>
          <Link to="/regions" className={pathname === '/regions' ? 'active' : ''}>
            Our Regions
          </Link>
        </li>
        <li>
          <Link
            to="/donate"
            className={pathname === "/donate" ? "active" : ""}
            style={{
              color: pathname === "/donate" ? undefined : "var(--gold)",
            }}
          >
            Donate
          </Link>
        </li>
        <li>
          <Link to="/" className="">
            Contact
          </Link>
        </li>
        <li>
          <Link to="/admin" className={pathname === "/admin" ? "active" : ""}>
            Admin
          </Link>
        </li>
        <li>
          <Link to="/donate" className="navbar__cta">
            Donate Now
          </Link>
        </li>

        {session?.isAuthenticated ? (
          <>
            <li style={{ color: "var(--gold)", fontSize: "0.85rem", display: "flex", alignItems: "center" }}>
              {session.email}
            </li>
            <li>
              <button onClick={handleLogout} className="navbar__cta" style={{ border: "none", background: "var(--red)", color: "var(--white)" }}>
                Logout
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link to="/login" className="navbar__cta" style={{ background: "var(--navy)" }}>
              Login
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
