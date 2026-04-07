// src/components/home/MissionSection.tsx
import counseling from '../../images/counseling.png';

export default function MissionSection() {
  return (
    <div className="section" style={{ background: 'white' }}>
      <div className="section__inner">
        <div className="mission-grid">
          <img
            src={counseling}
            alt="Counseling session at Sheltered Light"
            className="mission__img"
          />

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
