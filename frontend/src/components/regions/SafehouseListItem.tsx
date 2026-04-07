import { SafehouseInfo } from '../../hooks/useRegionData';

interface Props {
  safehouse: SafehouseInfo;
}

function OccupancyPill({ pct }: { pct: number }) {
  let style: React.CSSProperties;
  if (pct >= 100) {
    style = { background: '#FCEBEB', color: '#A32D2D' };
  } else if (pct >= 80) {
    style = { background: '#FAEEDA', color: '#854F0B' };
  } else {
    style = { background: '#E1F5EE', color: '#085041' };
  }
  return (
    <span style={{
      ...style,
      fontSize: '0.7rem',
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: 999,
      whiteSpace: 'nowrap',
    }}>
      {pct}%
    </span>
  );
}

export default function SafehouseListItem({ safehouse }: Props) {
  const pct = Math.round((safehouse.occupied / safehouse.capacity) * 100);
  return (
    <div className="sh-list-item">
      <span className="sh-list-item__dot" aria-hidden="true">●</span>
      <span className="sh-list-item__city">{safehouse.city}</span>
      <span className="sh-list-item__capacity">
        {safehouse.occupied} / {safehouse.capacity}
      </span>
      <OccupancyPill pct={pct} />
    </div>
  );
}
