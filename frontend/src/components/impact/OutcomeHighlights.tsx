import { ImpactSummary } from '../../hooks/useImpactSummary';

interface Props {
  data: ImpactSummary | null;
  loading: boolean;
}

export default function OutcomeHighlights({ data, loading }: Props) {
  const riskPct = data?.riskImprovement.percent ?? 0;

  return (
    <section className="impact-section" aria-labelledby="outcomes-heading">
      <h2 className="impact-section-title" id="outcomes-heading">Outcomes that matter</h2>
      <p className="impact-section-subtitle">
        Measurable change in the lives of every girl we serve.
      </p>

      <div className="outcomes-grid">
        {/* Card A — Risk Level */}
        <div className="outcome-card">
          <div className="outcome-card__icon" aria-hidden="true">
            <svg className="outcome-card__icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V5l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 52, width: '60%', margin: '0 auto 12px' }} />
          ) : (
            <div className="outcome-card__num" aria-label={`${riskPct} percent`}>
              {riskPct}%
            </div>
          )}
          <div className="outcome-card__label">
            of girls reduced their risk level while in care
          </div>
        </div>

        {/* Card B — Education */}
        <div className="outcome-card">
          <div className="outcome-card__icon" aria-hidden="true">
            <svg className="outcome-card__icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M2 9l10-5 10 5-10 5L2 9z" />
              <path d="M6 11v4c0 1.5 2.7 3 6 3s6-1.5 6-3v-4" />
            </svg>
          </div>
          <div className="outcome-card__num" aria-label="78.5 percent average education progress">
            78.5%
          </div>
          <div className="outcome-card__label">
            average education progress: +22 points improvement over the program period
          </div>
        </div>

        {/* Card C — Health */}
        <div className="outcome-card">
          <div className="outcome-card__icon" aria-hidden="true">
            <svg className="outcome-card__icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </div>
          <div className="outcome-card__num" aria-label="Health score increased from 3.03 to 3.40">
            3.03 → 3.40
          </div>
          <div className="outcome-card__label">
            average health score increase since 2023
          </div>
        </div>
      </div>
    </section>
  );
}
