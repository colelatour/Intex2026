import { ImpactSummary } from '../../hooks/useImpactSummary';

interface Props {
  data: ImpactSummary | null;
  loading: boolean;
}

const CARDS = [
  { key: 'totalGirlsServed',    label: 'Girls served'         },
  { key: 'activeResidents',     label: 'Currently in care'         },
  { key: 'girlsReintegrated',   label: 'Successfully reintegrated' },
  { key: 'activeSafehouses',    label: 'Active safehouses'         },
] as const;

export default function HeroMetricCards({ data, loading }: Props) {
  return (
    <div className="hero-cards">
      <div className="hero-cards__grid" role="list" aria-label="Key impact numbers">
        {CARDS.map(({ key, label }) => (
          <div className="hero-card" key={key} role="listitem">
            {loading ? (
              <div className="skeleton skeleton-card" aria-hidden="true" />
            ) : (
              <>
                <div className="hero-card__num" aria-label={`${data?.heroMetrics[key]} ${label}`}>
                  {data?.heroMetrics[key].toLocaleString() ?? '—'}
                </div>
                <div className="hero-card__label">{label}</div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
