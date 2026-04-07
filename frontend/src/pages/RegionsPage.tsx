import { useState, useMemo } from 'react';
import '../styles/RegionsPage.css';
import { useNavigate } from 'react-router-dom';
import { useRegionData, RegionKey, ALL_SAFEHOUSES } from '../hooks/useRegionData';
import PhilippinesMap   from '../components/regions/PhilippinesMap';
import RegionDetailPanel from '../components/regions/RegionDetailPanel';

export default function RegionsPage() {
  const navigate = useNavigate();
  const regionData = useRegionData();
  const [selected, setSelected] = useState<RegionKey>('visayas');

  // Build occupancy lookup: safehouse code → girls in care
  const occupancyByCode = useMemo(() =>
    Object.fromEntries(ALL_SAFEHOUSES.map(s => [s.code, s.occupied])),
    []
  );

  return (
    <div className="regions-page">

      {/* ── Part 1: Page header ─────────────────────────────────────────────── */}
      <div className="regions-header">
        <div className="regions-header__inner">
          <h1 className="regions-header__title">Where we work</h1>
          <p className="regions-header__subtitle">
            Lighthouse Sanctuary operates 9 safehouses across three regions of the Philippines.
            Click a region to learn more and support the girls there.
          </p>
        </div>
      </div>

      {/* ── Part 2: Map + detail panel ─────────────────────────────────────── */}
      <div className="regions-main">
        <div className="regions-map-col">
          <PhilippinesMap
            selectedRegion={selected}
            onSelectRegion={setSelected}
            safehouses={ALL_SAFEHOUSES}
            occupancyByCode={occupancyByCode}
          />
        </div>

        <div className="regions-panel-col">
          <RegionDetailPanel
            regionKey={selected}
            data={regionData[selected]}
          />
        </div>
      </div>

      {/* ── Part 3: Bottom CTA strip ────────────────────────────────────────── */}
      <div className="regions-cta-strip">
        <h2 className="regions-cta-strip__title">Every region needs you</h2>
        <p className="regions-cta-strip__body">
          Whether you feel connected to Luzon, Visayas, or Mindanao — or simply want to
          support wherever the need is greatest — your donation reaches a girl who needs it.
        </p>
        <div className="regions-cta-strip__btns">
          <button
            className="cta-btn-primary"
            onClick={() => navigate('/donate')}
          >
            Donate to any region
          </button>
          <button
            className="cta-btn-outline-dark"
            onClick={() => navigate('/impact')}
          >
            Back to our impact
          </button>
        </div>
      </div>

    </div>
  );
}
