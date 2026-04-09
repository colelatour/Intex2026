// src/components/home/HeroSection.tsx
import { useNavigate } from 'react-router-dom';
import groupPhoto from '../../images/group_photo.png';
import imageLogo from '../../images/sheltered_light_image_title_logo.png';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <div className="hero">
      <div className="hero__inner">

        <img
          src={imageLogo}
          alt="Sheltered Light — Restoring Lives, Rebuilding Futures"
          className="hero__image-logo"
        />

        <div className="hero__content">
          <img
            src={groupPhoto}
            alt="Girls at Sheltered Light safehouse"
            className="hero__image"
          />
          <p className="hero__body">
            Sheltered Light provides safe homes, counseling, and education to girls who are
            survivors of trafficking and abuse — giving them a real path forward.
          </p>
          <div className="hero__btns">
            <button className="btn-primary" onClick={() => navigate('/donate')}>
              Make a Donation
            </button>
            <button className="btn-outline-navy" onClick={() => navigate('/submit-tip')}>
              Submit a Tip
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
