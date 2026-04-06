// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';
import '../../styles/Footer.css';

export default function Footer({ variant = 'default' }) {
  return (
    <footer className="footer">
      <div className="footer__logo">
        Safe<span>Haven</span>
      </div>

      <div className="footer__copy">
        {variant === 'donate'
          ? 'SafeHaven is a registered 501(c)3 nonprofit. Your donation is tax-deductible to the extent allowed by law.'
          : '© 2026 SafeHaven. All Rights Reserved. Registered 501(c)3 nonprofit.'}
      </div>

      <div className="footer__links">
        <Link to="#">Privacy Policy</Link>
        <Link to="#">Cookie Settings</Link>
        <Link to="#">Contact</Link>
        <Link to="/admin">Admin Login</Link>
      </div>
    </footer>
  );
}
