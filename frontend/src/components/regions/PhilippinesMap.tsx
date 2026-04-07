import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import { RegionKey, SafehouseInfo } from '../../hooks/useRegionData';

// ── Region membership ────────────────────────────────────────────────────────

const LUZON_NAMES = new Set([
  'Abra','Apayao','Benguet','Ifugao','Kalinga','Mountain Province',
  'Ilocos Norte','Ilocos Sur','La Union','Pangasinan',
  'Batanes','Cagayan','Nueva Vizcaya','Quirino',
  'Aurora','Bataan','Bulacan','Nueva Ecija','Pampanga','Tarlac','Zambales',
  'Cavite','Laguna','Batangas','Rizal','Quezon',
  'Marinduque','Mindoro Occidental','Mindoro Oriental','Palawan','Romblon',
  'Albay','Camarines Norte','Camarines Sur','Catanduanes','Masbate','Sorsogon',
  'Manila','Quezon City','Caloocan','Mandaluyong City','Marikina','Muntinlupa',
  'Navotas','Pasay','Paranaque','Las Pinas','Pateros','Pasig','San Juan',
  'Taguig','Valenzuela','Malabon','Makati',
  'Baguio','Angeles','Olongapo','Dagupan','Lucena','Naga','Santiago',
  'Puerto Princesa',
]);

const VISAYAS_NAMES = new Set([
  'Aklan','Antique','Capiz','Iloilo','Negros Occidental','Guimaras',
  'Bohol','Cebu','Negros Oriental','Siquijor',
  'Biliran','Eastern Samar','Leyte','Samar','Southern Leyte','Northern Samar',
  'Bacolod','Tacloban','Ormoc','Mandaue','Lapu-Lapu',
  // Cebu and Iloilo also appear as city features
]);

const MINDANAO_NAMES = new Set([
  'Zamboanga del Norte','Zamboanga Sibugay','Zamboanga del Sur',
  'Misamis Occidental','Misamis Oriental','Bukidnon','Camiguin','Lanao del Norte',
  'Lanao del Sur','Maguindanao','Basilan','Sulu','Tawi-Tawi',
  'Cotabato','Sultan Kudarat','Sarangani','South Cotabato',
  'Agusan del Norte','Agusan del Sur','Surigao del Norte','Surigao del Sur',
  'Davao del Norte','Compostela Valley','Davao del Sur','Davao Oriental',
  'Zamboanga','Iligan','Cagayan de Oro','Butuan','Davao','General Santos',
  'Ormoc',
]);

function getRegion(name: string | null | undefined): RegionKey | null {
  if (!name) return null;
  if (LUZON_NAMES.has(name))    return 'luzon';
  if (VISAYAS_NAMES.has(name))  return 'visayas';
  if (MINDANAO_NAMES.has(name)) return 'mindanao';
  return null;
}

// ── Colors ───────────────────────────────────────────────────────────────────

const REGION_COLORS: Record<RegionKey, { base: string; selected: string; hover: string }> = {
  luzon:    { base: '#9FE1CB', selected: '#1D9E75', hover: '#7ECFB5' },
  visayas:  { base: '#5DCAA5', selected: '#0F6E56', hover: '#3DB88A' },
  mindanao: { base: '#E1F5EE', selected: '#085041', hover: '#C5EAD9' },
};
const COLOR_OTHER  = '#D3D1C7';
const COLOR_HOVER_OTHER = '#BFBDB3';

function getFill(name: string | undefined, selected: RegionKey): string {
  const r = getRegion(name);
  if (!r) return COLOR_OTHER;
  return r === selected ? REGION_COLORS[r].selected : REGION_COLORS[r].base;
}

function getHoverFill(name: string | undefined, selected: RegionKey): string {
  const r = getRegion(name);
  if (!r) return COLOR_HOVER_OTHER;
  return r === selected ? REGION_COLORS[r].selected : REGION_COLORS[r].hover;
}

// ── Topology cache (module-level — fetched once per session) ─────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let topoCache: Topology | null = null;

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  selectedRegion: RegionKey;
  onSelectRegion: (r: RegionKey) => void;
  safehouses: SafehouseInfo[];
  occupancyByCode: Record<string, number>; // code → girls in care
}

// ── SVG viewBox dimensions ───────────────────────────────────────────────────
const VB_W = 500;
const VB_H = 620;

const TOPO_URL = '/phl.topo.json';

export default function PhilippinesMap({ selectedRegion, onSelectRegion, safehouses, occupancyByCode }: Props) {
  const svgRef    = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Tooltip position is in CSS pixels relative to the wrapper div
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current!);

    const projection = d3.geoMercator()
      .center([122, 12])
      .scale(1800)
      .translate([VB_W / 2, VB_H / 2]);

    const pathGen = d3.geoPath().projection(projection);

    function render(topo: Topology) {
      svg.selectAll('*').remove();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const geo = topojson.feature(topo, (topo.objects as any).phl as GeometryCollection);

      // Province paths
      const g = svg.append('g');

      type PhlFeature = GeoJSON.Feature & { properties: { name?: string } };

      g.selectAll<SVGPathElement, PhlFeature>('path')
        .data(geo.features as PhlFeature[])
        .join('path')
        .attr('d', d => pathGen(d) ?? '')
        .attr('fill', d => getFill(d.properties.name, selectedRegion))
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 0.4)
        .style('cursor', d => getRegion(d.properties.name) ? 'pointer' : 'default')
        .on('click', (_event, d) => {
          const r = getRegion(d.properties.name);
          if (r) onSelectRegion(r);
        })
        .on('mouseenter', function (_event, d) {
          d3.select(this).attr('fill', getHoverFill(d.properties.name, selectedRegion));
        })
        .on('mouseleave', function (_event, d) {
          d3.select(this).attr('fill', getFill(d.properties.name, selectedRegion));
        });

      // Safehouse pins
      safehouses.forEach(sh => {
        const coords = projection([sh.lng, sh.lat]);
        if (!coords) return;
        const [cx, cy] = coords;
        const pinColor = REGION_COLORS[sh.region].selected;
        const girlsInCare = occupancyByCode[sh.code] ?? sh.occupied;

        svg.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 6)
          .attr('fill', 'white')
          .attr('stroke', pinColor)
          .attr('stroke-width', 2)
          .style('cursor', 'pointer')
          .on('mouseenter', (event: MouseEvent) => {
            const rect = wrapperRef.current!.getBoundingClientRect();
            setTooltip({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
              text: `${sh.city} — ${girlsInCare} girls in care`,
            });
          })
          .on('mouseleave', () => setTooltip(null))
          .on('click', () => onSelectRegion(sh.region));
      });
    }

    if (topoCache) {
      render(topoCache);
    } else {
      d3.json<Topology>(TOPO_URL).then(topo => {
        if (topo) {
          topoCache = topo;
          render(topo);
        }
      });
    }
  }, [selectedRegion, onSelectRegion, safehouses, occupancyByCode]);

  return (
    <div
      className="map-container"
      role="img"
      aria-label="Interactive map of Lighthouse Sanctuary regions in the Philippines"
    >
      {/* Wrapper gives tooltip its positioning context */}
      <div ref={wrapperRef} style={{ position: 'relative' }}>
        {/* SVG is fully D3-owned — no React children inside */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />

        {/* Tooltip lives outside SVG so D3's selectAll('*').remove() can't kill it */}
        {tooltip && (
          <div
            style={{
              position: 'absolute',
              left: tooltip.x,
              top: tooltip.y - 40,
              transform: 'translateX(-50%)',
              background: 'rgba(30,24,20,0.85)',
              color: '#fff',
              fontSize: 11,
              padding: '4px 10px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="map-legend" aria-label="Map legend">
        {(['luzon', 'visayas', 'mindanao'] as RegionKey[]).map(r => (
          <button
            key={r}
            className={`map-legend__item ${selectedRegion === r ? 'map-legend__item--active' : ''}`}
            onClick={() => onSelectRegion(r)}
            style={{ '--legend-color': REGION_COLORS[r].selected } as React.CSSProperties}
            aria-pressed={selectedRegion === r}
          >
            <span className="map-legend__swatch" />
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
