import { ImpactSummary } from '../../hooks/useImpactSummary';

interface Props {
  data: ImpactSummary | null;
  loading: boolean;
}

export default function IncidentResolution({ data, loading }: Props) {
  const ir = data?.incidentResolution;
  const pct = ir?.resolutionRatePercent ?? 0;

  return (
    <div className="incidents-band" role="region" aria-labelledby="incidents-heading">
      <div className="incidents-inner">
        {loading ? (
          <div className="skeleton" style={{ height: 72, width: 180 }} aria-hidden="true" />
        ) : (
          <div className="incidents-num" aria-label={`${pct} percent`}>{pct}%</div>
        )}
        <div className="incidents-label" id="incidents-heading">of incidents fully resolved</div>
        <p className="incidents-sub">
          When challenges arise, our team responds.{' '}
          {loading ? '…' : `${ir?.resolvedIncidents ?? 0} of ${ir?.totalIncidents ?? 0} incidents recorded have been fully resolved.`}{' '}
          This transparency reflects our commitment to accountability.
        </p>
      </div>
    </div>
  );
}
