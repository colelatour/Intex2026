import { get } from "./api";
import type {
  SafehouseComparisonRow,
  SafehouseFilterOptions,
  SafehouseFlowRow,
  SafehouseOccupancyPoint,
  SafehouseOutcomeRow,
  SafehouseSummary,
} from "../types/SafehouseReports";

export interface SafehouseReportQuery {
  startDate: string;
  endDate: string;
  safehouseId?: string | null;
  region?: string | null;
}

function buildQueryString(query: SafehouseReportQuery): string {
  const params = new URLSearchParams({
    startDate: query.startDate,
    endDate: query.endDate,
  });

  if (query.safehouseId) {
    params.set("safehouseId", query.safehouseId);
  }

  if (query.region) {
    params.set("region", query.region);
  }

  return params.toString();
}

export function getSafehouseReportSummary(query: SafehouseReportQuery): Promise<SafehouseSummary> {
  return get<SafehouseSummary>(`/api/reports/safehouses/summary?${buildQueryString(query)}`);
}

export function getSafehouseReportOccupancy(query: SafehouseReportQuery): Promise<SafehouseOccupancyPoint[]> {
  return get<SafehouseOccupancyPoint[]>(`/api/reports/safehouses/occupancy?${buildQueryString(query)}`);
}

export function getSafehouseReportComparison(query: SafehouseReportQuery): Promise<SafehouseComparisonRow[]> {
  return get<SafehouseComparisonRow[]>(`/api/reports/safehouses/comparison?${buildQueryString(query)}`);
}

export function getSafehouseReportOutcomes(query: SafehouseReportQuery): Promise<SafehouseOutcomeRow[]> {
  return get<SafehouseOutcomeRow[]>(`/api/reports/safehouses/outcomes?${buildQueryString(query)}`);
}

export function getSafehouseReportFlow(query: SafehouseReportQuery): Promise<SafehouseFlowRow[]> {
  return get<SafehouseFlowRow[]>(`/api/reports/safehouses/flow?${buildQueryString(query)}`);
}

export function getSafehouseReportFilters(): Promise<SafehouseFilterOptions> {
  return get<SafehouseFilterOptions>("/api/reports/safehouses/filters");
}
