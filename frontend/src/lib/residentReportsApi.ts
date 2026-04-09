import { get } from "./api";
import type {
  ResidentExitPathway,
  ResidentFilterOptions,
  ResidentLengthOfStayBucket,
  ResidentOutcomeBar,
  ResidentReportSummary,
  ResidentStatusSlice,
  ResidentTrendPoint,
} from "../types/ResidentReports";

export interface ResidentReportQuery {
  startDate: string;
  endDate: string;
  status?: string | null;
  safehouseId?: string | null;
  caseCategory?: string | null;
  granularity?: "day" | "week" | "month";
}

function buildQueryString(query: ResidentReportQuery): string {
  const params = new URLSearchParams({
    startDate: query.startDate,
    endDate: query.endDate,
  });

  if (query.status) {
    params.set("status", query.status);
  }

  if (query.safehouseId) {
    params.set("safehouseId", query.safehouseId);
  }

  if (query.caseCategory) {
    params.set("caseCategory", query.caseCategory);
  }

  if (query.granularity) {
    params.set("granularity", query.granularity);
  }

  return params.toString();
}

export function getResidentReportSummary(query: ResidentReportQuery): Promise<ResidentReportSummary> {
  return get<ResidentReportSummary>(`/api/reports/residents/summary?${buildQueryString(query)}`);
}

export function getResidentReportTrends(query: ResidentReportQuery): Promise<ResidentTrendPoint[]> {
  return get<ResidentTrendPoint[]>(`/api/reports/residents/trends?${buildQueryString(query)}`);
}

export function getResidentReportStatusBreakdown(query: ResidentReportQuery): Promise<ResidentStatusSlice[]> {
  return get<ResidentStatusSlice[]>(`/api/reports/residents/status-breakdown?${buildQueryString(query)}`);
}

export function getResidentReportLengthOfStay(query: ResidentReportQuery): Promise<ResidentLengthOfStayBucket[]> {
  return get<ResidentLengthOfStayBucket[]>(`/api/reports/residents/length-of-stay?${buildQueryString(query)}`);
}

export function getResidentReportOutcomes(query: ResidentReportQuery): Promise<ResidentOutcomeBar[]> {
  return get<ResidentOutcomeBar[]>(`/api/reports/residents/outcomes?${buildQueryString(query)}`);
}

export function getResidentReportExitPathways(query: ResidentReportQuery): Promise<ResidentExitPathway[]> {
  return get<ResidentExitPathway[]>(`/api/reports/residents/exit-pathways?${buildQueryString(query)}`);
}

export function getResidentReportFilters(): Promise<ResidentFilterOptions> {
  return get<ResidentFilterOptions>("/api/reports/residents/filters");
}
