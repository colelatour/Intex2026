import { useEffect, useState } from 'react';
import { get } from '../lib/api';

export interface EmotionalTransformationData {
  totalSessions: number;
  improvedSessions: number;
  improvedPercent: number;
  startStateBreakdown: Record<string, number>;
  endStateBreakdown: Record<string, number>;
}

interface UseEmotionalTransformationResult {
  data: EmotionalTransformationData | null;
  loading: boolean;
  error: string | null;
}

export function useEmotionalTransformation(): UseEmotionalTransformationResult {
  const [data, setData] = useState<EmotionalTransformationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    get<EmotionalTransformationData>('/api/impact/emotional-transformation')
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
