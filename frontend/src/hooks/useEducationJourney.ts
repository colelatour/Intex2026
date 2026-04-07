import { useEffect, useState } from 'react';

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
    fetch('/api/impact/education-journey')
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((json: EducationJourneyPoint[]) => {
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
