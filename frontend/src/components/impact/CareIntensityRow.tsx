import { ImpactSummary } from '../../hooks/useImpactSummary';

interface Props {
  data: ImpactSummary | null;
  loading: boolean;
}

export default function CareIntensityRow({ data, loading }: Props) {
  const ci = data?.careIntensity;

  const tiles = [
    { num: ci?.totalProcessRecordingSessions, label: 'Social work sessions conducted' },
    { num: ci?.avgSessionsPerResident,        label: 'Average sessions per girl'       },
    { num: ci?.totalHomeVisitations,          label: 'Home visits to families'         },
  ];

  return (
    <section className="impact-section" aria-labelledby="care-heading">
      <h2 className="impact-section-title" id="care-heading">Sustained, personalised care</h2>
      <p className="impact-section-subtitle">
        Behind every outcome is hundreds of hours of one-on-one attention.
      </p>

      <div className="care-grid" role="list" aria-label="Care intensity statistics">
        {tiles.map(({ num, label }) => (
          <div className="care-tile" key={label} role="listitem">
            {loading ? (
              <div className="skeleton" style={{ height: 48, width: '60%', margin: '0 auto 12px' }} aria-hidden="true" />
            ) : (
              <div className="care-tile__num" aria-label={`${num} ${label}`}>
                {typeof num === 'number' ? num.toLocaleString() : '—'}
              </div>
            )}
            <div className="care-tile__label">{label}</div>
          </div>
        ))}
      </div>

      <p className="care-copy">
        "Every girl receives sustained, personalised attention — not just a roof over her head."
      </p>
    </section>
  );
}
