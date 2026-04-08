import { useEffect, useState } from 'react';
import { get } from '../lib/api';

export interface EducationJourneyPoint {
  monthOffset: number;
  avgProgress: number;
  girlsIncluded: number;
}

interface UseEducationJourneyResult {
  data: EducationJourneyPoint[] | null;
  loading: boolean;
  error: string | null;
}

export function useEducationJourney(): UseEducationJourneyResult {
  const [data, setData] = useState<EducationJourneyPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    get<EducationJourneyPoint[]>('/api/impact/education-journey')
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
