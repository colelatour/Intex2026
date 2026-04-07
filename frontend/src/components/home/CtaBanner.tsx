// src/components/home/CtaBanner.tsx
import { useNavigate } from 'react-router-dom';

export default function CtaBanner() {
  const navigate = useNavigate();

  return (
    <div className="cta-banner">
      <h2>Ready to Make a Difference?</h2>
      <p>
        Join our growing community of donors and partners helping girls in the
        Philippines find safety, healing, and hope.
      </p>
      <div className="cta-banner__btns">
        <button className="btn-white" onClick={() => navigate('/donate')}>
          Donate Today
        </button>
        <button className="btn-outline-white2">Get Involved</button>
      </div>
    </div>
  );
}
