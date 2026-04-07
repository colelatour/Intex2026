// src/components/layout/Footer.tsx
import { Link } from 'react-router-dom';
import '../../styles/Footer.css';

interface FooterProps {
  variant?: 'default' | 'donate';
}

export default function Footer({ variant = 'default' }: FooterProps) {
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
        <Link to="/privacy">Privacy Policy</Link>
        <button
          className="footer__link-btn"
          onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
        >
          Cookie Settings
        </button>
        <Link to="#">Contact</Link>
        <Link to="/login">Admin Login</Link>
      </div>
    </footer>
  );
}
