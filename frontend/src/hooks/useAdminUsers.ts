import { useEffect, useState, useCallback } from 'react';
import { get } from '../lib/api';

export interface UserListItem {
  id: string;
  email: string;
  role: string;
}

export interface UserListResponse {
  items: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UseAdminUsersParams {
  page: number;
  pageSize: number;
  search: string;
  role: string;
}

export function useAdminUsers(params: UseAdminUsersParams) {
  const [data, setData] = useState<UserListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams();
    q.set('page', String(params.page));
    q.set('pageSize', String(params.pageSize));
    if (params.search) q.set('search', params.search);
    if (params.role) q.set('role', params.role);

    get<UserListResponse>(`/api/admin/users?${q}`)
      .then(d => { setData(d); setLoading(false); setError(null); })
      .catch((err: Error) => { setError(err.message); setLoading(false); });
  }, [params.page, params.pageSize, params.search, params.role]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}
