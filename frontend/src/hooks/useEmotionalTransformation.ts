import { useEffect, useState } from 'react';

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
    fetch('/api/impact/emotional-transformation')
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((json: EmotionalTransformationData) => {
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
