// src/pages/Donate.jsx
import '../styles/Donate.css';

import DonationForm from '../components/donate/DonationForm';
import DonationInfo from '../components/donate/DonationInfo';
import Footer       from '../components/layout/Footer';

const STATS = [
  { num: '247',   label: 'Girls Currently in Care' },
  { num: '1,842', label: 'Successfully Reintegrated' },
  { num: '12',    label: 'Active Safehouses' },
  { num: '38',    label: 'Donors & Partners' },
];

export default function Donate() {
  return (
    <>
      {/* Hero */}
      <div className="donate-hero">
        <div className="donate-hero__eyebrow">Make a Difference Today</div>
        <h1>Your Gift Restores Lives</h1>
        <p>
          Every contribution helps provide safe shelter, counseling, education, and a
          path to healing for girls who have survived trafficking and abuse in the
          Philippines.
        </p>
      </div>

      {/* Stats */}
      <div className="donate-stats">
        <div className="donate-stats__inner">
          {STATS.map((s) => (
            <div className="d-stat" key={s.label}>
              <span className="d-stat__num">{s.num}</span>
              <div className="d-stat__bar" />
              <div className="d-stat__label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="donate-body">
        <div className="donate-grid">
          <DonationForm />
          <DonationInfo />
        </div>
      </div>

      <Footer variant="donate" />
    </>
  );
}
