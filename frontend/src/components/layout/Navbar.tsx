import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getSession, logout } from "../../lib/authApi";
import type { AuthSession } from "../../types/AuthSession";
import "../../styles/Navbar.css";

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSession()
      .then(setSession)
      .catch(() => setSession(null));
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    setSession(null);
    setProfileOpen(false);
    navigate("/");
  }

  const isAuthenticated = session?.isAuthenticated ?? false;
  const roles = session?.roles ?? [];
  const isAdmin = roles.includes("Admin");
  const isDonor = roles.includes("Donor") || isAdmin;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__logo">
        <div className="navbar__logo-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        Sheltered<span>Light</span>
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
          <Link to="/impact" className={pathname === "/impact" ? "active" : ""}>
            Impact
          </Link>
        </li>
        <li>
          <Link
            to="/regions"
            className={pathname === "/regions" ? "active" : ""}
          >
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
        {isAdmin && (
          <li>
            <Link to="/admin" className={pathname === "/admin" ? "active" : ""}>
              Admin
            </Link>
          </li>
        )}
        <li>
          <Link to="/donate" className="navbar__cta">
            Donate Now
          </Link>
        </li>

        {isAuthenticated ? (
          <li className="navbar__profile-wrapper" ref={profileRef}>
            <button
              className="navbar__profile-btn"
              onClick={() => setProfileOpen((prev) => !prev)}
              aria-expanded={profileOpen}
            >
              <span className="navbar__avatar">
                {(session!.email?.[0] ?? "U").toUpperCase()}
              </span>
            </button>
            {profileOpen && (
              <div className="navbar__profile-dropdown">
                <div className="navbar__profile-header">
                  <span className="navbar__profile-email">{session!.email}</span>
                  <span className="navbar__profile-role">{roles.join(", ")}</span>
                </div>
                <hr className="navbar__profile-divider" />
                <Link
                  to="/account"
                  className="navbar__profile-item"
                  onClick={() => setProfileOpen(false)}
                >
                  Account Details
                </Link>
                <button
                  onClick={handleLogout}
                  className="navbar__profile-item navbar__profile-item--logout"
                >
                  Logout
                </button>
              </div>
            )}
          </li>
        ) : (
          <li>
            <Link
              to="/login"
              className="navbar__cta"
              style={{ background: "var(--navy)" }}
            >
              Login
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
