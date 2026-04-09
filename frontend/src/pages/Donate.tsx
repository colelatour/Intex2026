// src/pages/Donate.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/Donate.css';

import DonationForm from '../components/donate/DonationForm';
import DonationInfo from '../components/donate/DonationInfo';
import Footer from '../components/layout/Footer';

export default function Donate() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

  return (
    <>
      <section className="donate-hero">
        <div className="donate-hero__inner">
          <h1 className="donate-hero__title">Support One Girl at a Time</h1>
          <p className="donate-hero__subtitle">
            Your gift helps provide safety, healing, and education for girls across the Philippines.
          </p>
        </div>
      </section>

      <section className="donate-body donate-lean-body">
        <div className="donate-lean-grid">
          <DonationForm />
          <DonationInfo />
        </div>
      </section>

      <div className="cta-footer-wrap">
        <Footer variant="donate" />
      </div>
    </>
  );
}
