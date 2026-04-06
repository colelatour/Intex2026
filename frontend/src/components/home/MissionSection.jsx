// src/components/home/MissionSection.jsx

export default function MissionSection() {
  return (
    <div className="section" style={{ background: 'white' }}>
      <div className="section__inner">
        <div className="mission-grid">
          <div className="mission__img-placeholder">
            <svg width="36" height="36" fill="none" stroke="#c8952a" strokeWidth="1.5" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9l4-4 4 4 4-4 4 4" />
              <circle cx="8.5" cy="14.5" r="1.5" />
              <path d="M21 15l-5-5-5 5" />
            </svg>
            <span>Watch: Our Story &amp; Safehouses</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Video placeholder</span>
          </div>

          <div className="mission__text">
            <div className="section-eyebrow">Our Mission</div>
            <h2 className="section__title">A Safe Place to Heal and Grow</h2>
            <p>
              We work with trusted in-country partners to operate safehouses across the
              Philippines, providing structured rehabilitation services for girls who have
              survived abuse and trafficking.
            </p>
            <p>
              Our approach covers every stage — from initial intake and trauma counseling,
              through education and skills development, to successful reintegration into
              family and community.
            </p>
            <a className="read-more" href="#">Read our full story →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
