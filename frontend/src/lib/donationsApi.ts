import { get, post } from "./api";
import type {
  DonationBreakdownSlice,
  DonationDistributionBucket,
  DonationFilterOptions,
  DonationReportSummary,
  DonationTrendPoint,
  TopContributor,
} from "../types/DonationReports";

export interface RecordDonationRequest {
  amount: number;
  currencyCode: string;
  isRecurring: boolean;
  firstName: string;
  lastName: string;
  email: string;
  region?: string;
  isHonorGift: boolean;
  honoreeName?: string;
  honoreeEmail?: string;
  honorMessage?: string;
}

export interface RecordDonationResponse {
  donationId: string;
  supporterId: string;
  amount: number;
  currencyCode: string;
  donationDate: string;
}

export function recordDonation(payload: RecordDonationRequest): Promise<RecordDonationResponse> {
  return post<RecordDonationResponse>("/api/donations/record", payload);
}

export interface DonationReportQuery {
  startDate: string;
  endDate: string;
  minAmount?: number | null;
  maxAmount?: number | null;
  campaign?: string | null;
  breakdown?: string;
  granularity?: "day" | "week" | "month";
}

function buildQueryString(query: DonationReportQuery): string {
  const params = new URLSearchParams({
    startDate: query.startDate,
    endDate: query.endDate,
    breakdown: query.breakdown ?? "campaign",
  });

  if (query.granularity) {
    params.set("granularity", query.granularity);
  }

  if (query.minAmount != null && Number.isFinite(query.minAmount)) {
    params.set("minAmount", String(query.minAmount));
  }

  if (query.maxAmount != null && Number.isFinite(query.maxAmount)) {
    params.set("maxAmount", String(query.maxAmount));
  }

  if (query.campaign) {
    params.set("campaign", query.campaign);
  }

  return params.toString();
}

export function getDonationReportSummary(query: DonationReportQuery): Promise<DonationReportSummary> {
  return get<DonationReportSummary>(`/api/reports/donations/summary?${buildQueryString(query)}`);
}

export function getDonationReportTrends(query: DonationReportQuery): Promise<DonationTrendPoint[]> {
  return get<DonationTrendPoint[]>(`/api/reports/donations/trends?${buildQueryString(query)}`);
}

export function getDonationReportDistribution(query: DonationReportQuery): Promise<DonationDistributionBucket[]> {
  return get<DonationDistributionBucket[]>(`/api/reports/donations/distribution?${buildQueryString(query)}`);
}

export function getDonationReportBreakdown(query: DonationReportQuery): Promise<DonationBreakdownSlice[]> {
  return get<DonationBreakdownSlice[]>(`/api/reports/donations/breakdown?${buildQueryString(query)}`);
}

export function getDonationReportTopContributors(query: DonationReportQuery): Promise<TopContributor[]> {
  return get<TopContributor[]>(`/api/reports/donations/top-contributors?${buildQueryString(query)}`);
}

export function getDonationReportFilterOptions(): Promise<DonationFilterOptions> {
  return get<DonationFilterOptions>("/api/reports/donations/filters");
}
