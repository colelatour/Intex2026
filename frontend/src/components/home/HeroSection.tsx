// src/components/home/HeroSection.tsx
import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <div className="hero">
      <div className="hero__inner">
        <div>
          <span className="hero__eyebrow">Safehouses · Rehabilitation · Philippines</span>
          <h1 className="hero__title">
            Restoring Lives,<br />
            <span className="accent">Rebuilding Futures</span>
          </h1>
          <p className="hero__body">
            Sheltered Light provides safe homes, counseling, and education to girls who are
            survivors of trafficking and abuse — giving them a real path forward.
          </p>
          <div className="hero__btns">
            <button className="btn-primary" onClick={() => navigate('/donate')}>
              Make a Donation
            </button>
            <button className="btn-outline-white">
              Learn Our Mission
            </button>
          </div>
        </div>

        <div className="hero__image-placeholder">
          <svg width="32" height="32" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9l4-4 4 4 4-4 4 4" />
            <circle cx="8.5" cy="14.5" r="1.5" />
            <path d="M21 15l-5-5-5 5" />
          </svg>
          <span>Hero Image Placeholder</span>
          <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Upload your photo here</span>
        </div>
      </div>
    </div>
  );
}
