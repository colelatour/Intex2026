import { useEffect, useState, useCallback } from 'react';
import { get } from '../lib/api';

export interface SupporterListItem {
  supporterId: string;
  displayName: string | null;
  email: string | null;
  supporterType: string | null;
  status: string | null;
  region: string | null;
  totalDonations: number;
  totalValue: number;
  latestDonationDate: string | null;
  churnProbability: number | null;
  churnRiskLabel: string | null;
}

export interface SupporterListResponse {
  items: SupporterListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DonationSummary {
  donationId: string | null;
  donationType: string | null;
  donationDate: string | null;
  amount: number | null;
  currencyCode: string | null;
  isRecurring: boolean;
  notes: string | null;
}

export interface SupporterDetail {
  supporterId: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  supporterType: string | null;
  relationshipType: string | null;
  status: string | null;
  region: string | null;
  country: string | null;
  acquisitionChannel: string | null;
  organizationName: string | null;
  createdAt: string | null;
  firstDonationDate: string | null;
  donations: DonationSummary[];
  churnProbability: number | null;
  churnRiskLabel: string | null;
}

export interface SupporterParams {
  page: number;
  search: string;
  supporterType: string;
  status: string;
  region: string;
}

export function useSupporters(params: SupporterParams) {
  const [data,    setData]    = useState<SupporterListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch_ = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams();
    q.set('page', String(params.page));
    if (params.search)       q.set('search',        params.search);
    if (params.supporterType) q.set('supporterType', params.supporterType);
    if (params.status)       q.set('status',        params.status);
    if (params.region)       q.set('region',        params.region);

    get<SupporterListResponse>(`/api/supporters?${q}`)
      .then(d => { setData(d); setLoading(false); setError(null); })
      .catch((err: Error) => { setError(err.message); setLoading(false); });
  }, [params.page, params.search, params.supporterType, params.status, params.region]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}

export function useSupporterDetail(id: string | null) {
  const [data,    setData]    = useState<SupporterDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setData(null); return; }
    setLoading(true);
    get<SupporterDetail>(`/api/supporters/${id}`)
      .then(d => { setData(d); setLoading(false); setError(null); })
      .catch((err: Error) => { setError(err.message); setLoading(false); });
  }, [id]);

  return { data, loading, error };
}
