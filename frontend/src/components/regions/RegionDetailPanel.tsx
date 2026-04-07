import { useNavigate } from 'react-router-dom';
import { RegionKey, RegionData } from '../../hooks/useRegionData';
import SafehouseListItem from './SafehouseListItem';

interface Props {
  regionKey: RegionKey;
  data: RegionData;
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="region-stat-tile">
      <div className="region-stat-tile__num">{value}</div>
      <div className="region-stat-tile__label">{label}</div>
    </div>
  );
}

export default function RegionDetailPanel({ regionKey, data }: Props) {
  const navigate = useNavigate();
  const cityList = data.safehouses.map(s => s.city).join(', ');
  const occupancyPct = Math.round((data.totalOccupied / data.totalCapacity) * 100);

  return (
    <div className="region-panel" aria-live="polite" aria-label={`${data.name} region details`}>
      {/* Header */}
      <div className="region-panel__header">
        <h2 className="region-panel__name">{data.name}</h2>
        <p className="region-panel__subhead">
          {data.safehouses.length} safehouses · {cityList}
        </p>
      </div>

      {/* Stats grid */}
      <div className="region-stats-grid" role="list" aria-label={`${data.name} impact statistics`}>
        <StatTile value={String(data.girlsServed)}     label="Girls served"               />
        <StatTile value={String(data.currentlyInCare)} label="Currently in care"           />
        <StatTile value={String(data.reintegrated)}    label="Successfully reintegrated"   />
        <StatTile value={`${data.riskImprovedPct}%`}   label="Risk level improved"         />
      </div>

      {/* Capacity summary */}
      <div className="region-capacity">
        <span>{data.totalOccupied} of {data.totalCapacity} beds occupied</span>
        <span className="region-capacity__pct">({occupancyPct}% capacity)</span>
      </div>

      {/* Safehouse list */}
      <div className="region-sh-list" aria-label={`Safehouses in ${data.name}`}>
        <div className="region-sh-list__header">
          <span>Location</span>
          <span>Girls / Capacity</span>
          <span>Occupancy</span>
        </div>
        {data.safehouses.map(sh => (
          <SafehouseListItem key={sh.code} safehouse={sh} />
        ))}
      </div>

      {/* Context paragraph */}
      <div className="chart-interpretation region-context">
        <p>{data.contextParagraph}</p>
      </div>

      {/* Donations */}
      <div className="region-donations">
        <span className="region-donations__label">Donations received</span>
        <span className="region-donations__amount">
          ₱{data.donationsPhp.toLocaleString()}
        </span>
      </div>

      {/* CTA */}
      <button
        className="region-cta-btn"
        onClick={() => navigate(`/donate?region=${regionKey}`)}
        aria-label={`Donate to ${data.name} region`}
      >
        Donate to {data.name}
      </button>
      <p className="region-cta-note">
        Your donation to this region goes directly to safehouses in {data.name}.
      </p>
    </div>
  );
}
