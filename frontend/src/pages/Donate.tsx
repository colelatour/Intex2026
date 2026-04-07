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
      <section className="donate-hero donate-lean-hero">
        <div className="donate-hero__eyebrow">Make a Difference Today</div>
        <h1>Support One Girl at a Time</h1>
        <p>
          A simplified donation experience focused on clarity and trust.
        </p>
      </section>

      <section className="donate-body donate-lean-body">
        <div className="donate-lean-grid">
          <DonationForm />
          <DonationInfo />
        </div>
      </section>

      <Footer variant="donate" />
    </>
  );
}
