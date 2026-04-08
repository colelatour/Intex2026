import { useEffect, useState } from 'react';
import { get } from '../lib/api';

export interface TrendPoint {
  month: string;
  avgHealthScore?: number;
  avgEducationProgress?: number;
}

export interface ImpactTrends {
  healthTrend: { month: string; avgHealthScore: number }[];
  educationTrend: { month: string; avgEducationProgress: number }[];
}

interface UseImpactTrendsResult {
  data: ImpactTrends | null;
  loading: boolean;
  error: string | null;
}

export function useImpactTrends(): UseImpactTrendsResult {
  const [data, setData] = useState<ImpactTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    get<ImpactTrends>('/api/impact/trends')
      .then((json) => {
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
