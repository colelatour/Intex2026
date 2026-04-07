import { useEffect, useState } from 'react';

export type RegionKey = 'luzon' | 'visayas' | 'mindanao';

export interface SafehouseInfo {
  code: string;
  city: string;
  lat: number;
  lng: number;
  capacity: number;
  occupied: number;
  region: RegionKey;
}

export interface RegionData {
  name: string;
  safehouses: SafehouseInfo[];
  girlsServed: number;
  currentlyInCare: number;
  reintegrated: number;
  riskImprovedPct: number;
  donationsPhp: number;
  totalCapacity: number;
  totalOccupied: number;
  openSince: string;
  contextParagraph: string;
}

// Hardcoded because the DB has no lat/lng columns.
const SAFEHOUSE_LATLNG: Record<string, { lat: number; lng: number }> = {
  SH01: { lat: 14.6760, lng: 121.0437 },
  SH02: { lat: 10.3157, lng: 123.8854 },
  SH03: { lat:  7.1907, lng: 125.4553 },
  SH04: { lat: 10.7202, lng: 122.5621 },
  SH05: { lat: 16.4023, lng: 120.5960 },
  SH06: { lat:  8.4542, lng: 124.6319 },
  SH07: { lat: 10.6770, lng: 122.9560 },
  SH08: { lat: 11.2543, lng: 124.9981 },
  SH09: { lat:  6.1164, lng: 125.1716 },
};

// Descriptive narrative text with no DB backing.
const CONTEXT_PARAGRAPHS: Record<RegionKey, string> = {
  luzon:
    'Luzon is home to two Lighthouse safehouses serving girls in Metro Manila and the Cordillera highlands. Our Quezon City safehouse is currently at full capacity, serving girls referred by government agencies and NGOs across the National Capital Region. 60% of girls in Luzon have reduced their risk level during their stay — the highest rate across all our regions.',
  visayas:
    'The Visayas is our largest operational region, with four safehouses spanning Cebu, Iloilo, Bacolod, and Tacloban. The region serves the highest number of girls of any region — reflecting both the scale of need and the strength of our local partnerships. Three of four safehouses are at or near full capacity.',
  mindanao:
    'Mindanao presents some of the most complex cases we serve, with a higher proportion of abandoned children than other regions. Our three safehouses in Davao City, Cagayan de Oro, and General Santos are operating at near-full capacity. This region receives the most operational support from local partners and is where additional donor funding would have the most direct impact on our ability to serve more girls.',
};

// ── API response types ────────────────────────────────────────────────────────

interface ApiSafehouseDto {
  code:     string;
  city:     string;
  capacity: number;
  occupied: number;
  status:   string;
}

interface ApiRegionDto {
  regionKey:       RegionKey;
  name:            string;
  totalCapacity:   number;
  totalOccupied:   number;
  openSince:       string;
  girlsServed:     number;
  currentlyInCare: number;
  reintegrated:    number;
  riskImprovedPct: number | null;
  donationsPhp:    number;
  safehouses:      ApiSafehouseDto[];
}

interface ApiRegionsResponse {
  regions: ApiRegionDto[];
}

// ── Merge helper ─────────────────────────────────────────────────────────────

function mergeRegion(api: ApiRegionDto): RegionData {
  const safehouses: SafehouseInfo[] = api.safehouses.map(sh => ({
    code:     sh.code,
    city:     sh.city,
    lat:      SAFEHOUSE_LATLNG[sh.code]?.lat ?? 0,
    lng:      SAFEHOUSE_LATLNG[sh.code]?.lng ?? 0,
    capacity: sh.capacity,
    occupied: sh.occupied,
    region:   api.regionKey,
  }));

  return {
    name:             api.name,
    safehouses,
    girlsServed:      api.girlsServed,
    currentlyInCare:  api.currentlyInCare,
    reintegrated:     api.reintegrated,
    riskImprovedPct:  api.riskImprovedPct ?? 0,
    donationsPhp:     api.donationsPhp,
    totalCapacity:    api.totalCapacity,
    totalOccupied:    api.totalOccupied,
    openSince:        api.openSince,
    contextParagraph: CONTEXT_PARAGRAPHS[api.regionKey],
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface UseRegionDataResult {
  data:    Record<RegionKey, RegionData> | null;
  loading: boolean;
  error:   string | null;
}

export function useRegionData(): UseRegionDataResult {
  const [data,    setData]    = useState<Record<RegionKey, RegionData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/impact/regions`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json() as Promise<ApiRegionsResponse>;
      })
      .then(json => {
        const record = {} as Record<RegionKey, RegionData>;
        for (const r of json.regions) {
          record[r.regionKey] = mergeRegion(r);
        }
        setData(record);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}
