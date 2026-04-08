import { useNavigate } from 'react-router-dom';
import { ImpactSummary } from '../../hooks/useImpactSummary';

interface Props {
  data: ImpactSummary | null;
}

export default function CallToActionBanner({ data }: Props) {
  const navigate = useNavigate();
  const total = data?.heroMetrics.totalGirlsServed ?? 0;
  const supporters = data?.donations.uniqueSupporters ?? 0;

  return (
    <div className="cta-banner" role="complementary" aria-labelledby="cta-heading">
      <h2 className="cta-banner__title" id="cta-heading">
        Your support changes a girl's trajectory
      </h2>
      <p className="cta-banner__body">
        {total > 0
          ? `${total} girls have found safety, healing, and education through Sheltered Light. Join ${supporters} supporters who are making it possible.`
          : 'Girls have found safety, healing, and education through Sheltered Light. Join our community of supporters making it possible.'}
      </p>
      <div className="cta-banner__btns">
        <button
          className="cta-btn-primary"
          onClick={() => navigate('/donate')}
          aria-label="Donate now to Sheltered Light"
        >
          Donate Now
        </button>
        <button
          className="cta-btn-outline"
          onClick={() => navigate('/about')}
          aria-label="Learn more about Sheltered Light"
        >
          Learn More
        </button>
      </div>
    </div>
  );
}
