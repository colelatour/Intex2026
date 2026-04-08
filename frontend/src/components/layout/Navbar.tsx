import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getSession, logout } from "../../lib/authApi";
import type { AuthSession } from "../../types/AuthSession";
import navbarLogo from "../../images/sheltered_light_navbar_logo.png";
import "../../styles/Navbar.css";

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  async function handleLogout() {
    await logout();
    setSession(null);
    setProfileOpen(false);
    navigate("/");
  }

  const isAuthenticated = session?.isAuthenticated ?? false;
  const roles = session?.roles ?? [];
  const isAdmin = roles.includes("Admin");
  const isWorker = roles.includes("Worker");
  const isStaff = isAdmin || isWorker;
  const isDonor = roles.includes("Donor") || isAdmin;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__logo">
        <img src={navbarLogo} alt="Sheltered Light" className="navbar__logo-img" />
      </Link>

      <button
        className="navbar__hamburger"
        onClick={() => setMobileMenuOpen((prev) => !prev)}
        aria-label="Toggle menu"
        aria-expanded={mobileMenuOpen}
      >
        <span className={`navbar__hamburger-line${mobileMenuOpen ? " open" : ""}`} />
        <span className={`navbar__hamburger-line${mobileMenuOpen ? " open" : ""}`} />
        <span className={`navbar__hamburger-line${mobileMenuOpen ? " open" : ""}`} />
      </button>

      <ul className={`navbar__links${mobileMenuOpen ? " navbar__links--open" : ""}`}>
        <li>
          <Link to="/" className={pathname === "/" ? "active" : ""} onClick={() => setMobileMenuOpen(false)}>
            Home
          </Link>
        </li>
        <li>
          <Link to="/" className="" onClick={() => setMobileMenuOpen(false)}>
            Our Mission
          </Link>
        </li>
        <li>
          <Link to="/impact" className={pathname === "/impact" ? "active" : ""} onClick={() => setMobileMenuOpen(false)}>
            Impact
          </Link>
        </li>
        <li>
          <Link
            to="/regions"
            className={pathname === "/regions" ? "active" : ""}
            onClick={() => setMobileMenuOpen(false)}
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
            onClick={() => setMobileMenuOpen(false)}
          >
            Donate
          </Link>
        </li>
        <li>
          <Link to="/" className="" onClick={() => setMobileMenuOpen(false)}>
            Contact
          </Link>
        </li>
        {isStaff && (
          <li>
            <Link
              to="/admin"
              className={pathname.startsWith("/admin") ? "active" : ""}
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin
            </Link>
          </li>
        )}

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
              className={pathname === "/login" ? "active" : ""}
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
          </li>
        )}
      </ul>

      {/* Backdrop overlay for mobile menu */}
      <div
        className={`navbar__overlay${mobileMenuOpen ? " navbar__overlay--visible" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
      />
    </nav>
  );
}
