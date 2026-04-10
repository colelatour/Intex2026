import { useEffect, useState, useCallback } from 'react';
import { get } from '../lib/api';
import type { DashboardResponse } from '../types/AdminDashboard';

export function useAdminDashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(() => {
    setLoading(true);
    setError(null);
    get<DashboardResponse>("/api/admin/dashboard?includeActivity=false")
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load dashboard'),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { data, loading, error, refresh: fetch_ };
}
