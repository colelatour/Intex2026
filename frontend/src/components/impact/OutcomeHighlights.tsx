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
          <div className="outcome-card__icon" aria-hidden="true">🛡️</div>
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
          <div className="outcome-card__icon" aria-hidden="true">🎓</div>
          <div className="outcome-card__num" aria-label="78.5 percent average education progress">
            78.5%
          </div>
          <div className="outcome-card__label">
            average education progress — +22 points improvement over the program period
          </div>
        </div>

        {/* Card C — Health */}
        <div className="outcome-card">
          <div className="outcome-card__icon" aria-hidden="true">❤️</div>
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
