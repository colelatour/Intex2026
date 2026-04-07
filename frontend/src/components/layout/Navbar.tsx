// src/components/layout/Navbar.tsx
import { Link, useLocation } from 'react-router-dom';
import '../../styles/Navbar.css';

export default function Navbar() {
  const { pathname } = useLocation();

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
          <Link to="/" className={pathname === '/' ? 'active' : ''}>
            Home
          </Link>
        </li>
        <li>
          <Link to="/" className="">
            Our Mission
          </Link>
        </li>
        <li>
          <Link to="/" className="">
            Impact
          </Link>
        </li>
        <li>
          <Link
            to="/donate"
            className={pathname === '/donate' ? 'active' : ''}
            style={{ color: pathname === '/donate' ? undefined : 'var(--gold)' }}
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
          <Link to="/admin" className={pathname === '/admin' ? 'active' : ''}>
            Admin
          </Link>
        </li>
        <li>
          <Link to="/donate" className="navbar__cta">
            Donate Now
          </Link>
        </li>
      </ul>
    </nav>
  );
}
