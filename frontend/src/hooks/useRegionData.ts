// TODO: replace with GET /api/impact/regions once endpoint is built

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

export const ALL_SAFEHOUSES: SafehouseInfo[] = [
  { code: 'SH01', city: 'Quezon City',    lat: 14.6760, lng: 121.0437, capacity:  8, occupied:  8, region: 'luzon'    },
  { code: 'SH02', city: 'Cebu City',      lat: 10.3157, lng: 123.8854, capacity: 10, occupied:  8, region: 'visayas'  },
  { code: 'SH03', city: 'Davao City',     lat:  7.1907, lng: 125.4553, capacity:  9, occupied:  9, region: 'mindanao' },
  { code: 'SH04', city: 'Iloilo City',    lat: 10.7202, lng: 122.5621, capacity: 12, occupied: 12, region: 'visayas'  },
  { code: 'SH05', city: 'Baguio City',    lat: 16.4023, lng: 120.5960, capacity: 11, occupied:  9, region: 'luzon'    },
  { code: 'SH06', city: 'Cagayan de Oro', lat:  8.4542, lng: 124.6319, capacity:  8, occupied:  6, region: 'mindanao' },
  { code: 'SH07', city: 'Bacolod',        lat: 10.6770, lng: 122.9560, capacity: 12, occupied: 12, region: 'visayas'  },
  { code: 'SH08', city: 'Tacloban',       lat: 11.2543, lng: 124.9981, capacity:  9, occupied:  7, region: 'visayas'  },
  { code: 'SH09', city: 'General Santos', lat:  6.1164, lng: 125.1716, capacity:  6, occupied:  6, region: 'mindanao' },
];

const REGION_DATA: Record<RegionKey, RegionData> = {
  luzon: {
    name: 'Luzon',
    safehouses: ALL_SAFEHOUSES.filter(s => s.region === 'luzon'),
    girlsServed: 16,
    currentlyInCare: 10,
    reintegrated: 8,
    riskImprovedPct: 60,
    donationsPhp: 58685,
    totalCapacity: 19,
    totalOccupied: 17,
    openSince: 'January 2022',
    contextParagraph:
      'Luzon is home to two Lighthouse safehouses serving girls in Metro Manila and the Cordillera highlands. Our Quezon City safehouse is currently at full capacity, serving girls referred by government agencies and NGOs across the National Capital Region. 60% of girls in Luzon have reduced their risk level during their stay — the highest rate across all our regions.',
  },
  visayas: {
    name: 'Visayas',
    safehouses: ALL_SAFEHOUSES.filter(s => s.region === 'visayas'),
    girlsServed: 30,
    currentlyInCare: 13,
    reintegrated: 6,
    riskImprovedPct: 50,
    donationsPhp: 133029,
    totalCapacity: 43,
    totalOccupied: 39,
    openSince: 'February 2022',
    contextParagraph:
      'The Visayas is our largest operational region, with four safehouses spanning Cebu, Iloilo, Bacolod, and Tacloban. The region serves the highest number of girls of any region — 30 in total — reflecting both the scale of need and the strength of our local partnerships. Three of four safehouses are at or near full capacity.',
  },
  mindanao: {
    name: 'Mindanao',
    safehouses: ALL_SAFEHOUSES.filter(s => s.region === 'mindanao'),
    girlsServed: 14,
    currentlyInCare: 7,
    reintegrated: 5,
    riskImprovedPct: 29,
    donationsPhp: 90722,
    totalCapacity: 23,
    totalOccupied: 21,
    openSince: 'April 2022',
    contextParagraph:
      'Mindanao presents some of the most complex cases we serve, with a higher proportion of abandoned children than other regions. Our three safehouses in Davao City, Cagayan de Oro, and General Santos are operating at 91% capacity. This region receives the most operational support from local partners and is where additional donor funding would have the most direct impact on our ability to serve more girls.',
  },
};

export function useRegionData() {
  return REGION_DATA;
}
