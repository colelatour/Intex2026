import { useEffect, useState } from 'react';

export interface DonationArea {
  area: string;
  amountPhp: number;
}

export interface ImpactSummary {
  heroMetrics: {
    totalGirlsServed: number;
    activeResidents: number;
    girlsReintegrated: number;
    activeSafehouses: number;
  };
  riskImprovement: {
    count: number;
    percent: number;
  };
  careIntensity: {
    totalProcessRecordingSessions: number;
    avgSessionsPerResident: number;
    totalHomeVisitations: number;
  };
  incidentResolution: {
    totalIncidents: number;
    resolvedIncidents: number;
    resolutionRatePercent: number;
  };
  donations: {
    totalPhp: number;
    uniqueSupporters: number;
    recurringDonationCount: number;
    byProgramArea: DonationArea[];
  };
}

interface UseImpactSummaryResult {
  data: ImpactSummary | null;
  loading: boolean;
  error: string | null;
}

export function useImpactSummary(): UseImpactSummaryResult {
  const [data, setData] = useState<ImpactSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/impact/summary`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((json: ImpactSummary) => {
        setData(json);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}
