// src/components/donate/DonationInfo.jsx

const GIFT_USES = [
  { icon: '🏠', bg: '#dbeafe', title: 'Safe Housing',          body: 'Maintaining secure, nurturing safehouses for residents across the Philippines.' },
  { icon: '💙', bg: '#fce7f3', title: 'Counseling & Healing',  body: 'Individual counseling sessions with trained social workers and trauma specialists.' },
  { icon: '📚', bg: '#dcfce7', title: 'Education',             body: 'School enrollment, tutoring, and learning resources for every resident.' },
  { icon: '🌱', bg: '#fef3c7', title: 'Reintegration Support', body: 'Programs to help residents safely rejoin their communities and families.' },
];

const OTHER_WAYS = [
  { label: 'In-Kind Donations',   link: 'Goods & Supplies' },
  { label: 'Volunteer Your Time', link: 'Volunteer' },
  { label: 'Skills Contribution', link: 'Pro-Bono' },
  { label: 'Share on Social Media', link: 'Advocate' },
];

export default function DonationInfo() {
  return (
    <div>
      {/* Where Your Gift Goes */}
      <div className="info-card">
        <h4>Where Your Gift Goes</h4>
        {GIFT_USES.map((g) => (
          <div className="gift-item" key={g.title}>
            <div className="gift-icon" style={{ background: g.bg }}>{g.icon}</div>
            <div className="gift-text">
              <h5>{g.title}</h5>
              <p>{g.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Other Ways to Give */}
      <div className="info-card">
        <h4>Other Ways to Give</h4>
        <ul className="other-ways-list">
          {OTHER_WAYS.map((w) => (
            <li key={w.label}>
              <span>{w.label}</span>
              <a href="#">{w.link}</a>
            </li>
          ))}
        </ul>
        <button className="ways-btn">Learn About Other Ways →</button>
      </div>

      {/* Testimonial */}
      <div className="testimonial-card">
        <div className="testimonial-card__quote">"</div>
        <p>
          Knowing that my monthly gift is directly tied to a girl's counseling sessions
          and education — not just a number — made all the difference. SafeHaven shows
          me exactly how my support is used.
        </p>
        <div className="testimonial-card__attribution">
          — Anonymous Donor, Monthly Giving Program
        </div>
      </div>
    </div>
  );
}
