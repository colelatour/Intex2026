import { useState, useMemo } from 'react';
import '../styles/RegionsPage.css';
import { useNavigate } from 'react-router-dom';
import { useRegionData, RegionKey } from '../hooks/useRegionData';
import PhilippinesMap   from '../components/regions/PhilippinesMap';
import RegionDetailPanel from '../components/regions/RegionDetailPanel';
import Footer from '../components/layout/Footer';

export default function RegionsPage() {
  const navigate = useNavigate();
  const { data: regionData, loading, error } = useRegionData();
  const [selected, setSelected] = useState<RegionKey>('visayas');

  const allSafehouses = useMemo(
    () => regionData ? Object.values(regionData).flatMap(r => r.safehouses) : [],
    [regionData]
  );

  const occupancyByCode = useMemo(
    () => Object.fromEntries(allSafehouses.map(s => [s.code, s.occupied])),
    [allSafehouses]
  );

  return (
    <main className="regions-page" aria-label="Regions page">

      {/* ── Part 1: Page header ─────────────────────────────────────────────── */}
      <div className="regions-header">
        <div className="regions-header__inner">
          <h1 className="regions-header__title">Where We Work</h1>
          <p className="regions-header__subtitle">
            Sheltered Light operates {allSafehouses.length} safehouses across three regions of the Philippines.
            Click a region to learn more and support the girls there.
          </p>
        </div>
      </div>

      {/* ── Part 2: Map + detail panel ─────────────────────────────────────── */}
      <div className="regions-main">
        <div className="regions-map-col">
          {error ? (
            <div className="regions-error">Unable to load region data.</div>
          ) : (
            <PhilippinesMap
              selectedRegion={selected}
              onSelectRegion={setSelected}
              safehouses={allSafehouses}
              occupancyByCode={occupancyByCode}
              contextParagraph={regionData?.[selected]?.contextParagraph}
            />
          )}
        </div>

        <div className="regions-panel-col">
          {loading ? (
            <div className="regions-loading">Loading region data…</div>
          ) : error ? (
            <div className="regions-error">{error}</div>
          ) : regionData ? (
            <RegionDetailPanel
              regionKey={selected}
              data={regionData[selected]}
            />
          ) : null}
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
        </div>
        <Footer />
      </div>

    </main>
  );
}
