export interface ResidentReportFilters {
  startDate: string;
  endDate: string;
  status: string | null;
  safehouseId: string | null;
  caseCategory: string | null;
}

export interface ResidentReportSummary {
  filters: ResidentReportFilters;
  totalResidentsHistorical: number;
  totalResidentsInRange: number;
  activeResidents: number;
  completionRate: number;
  averageLengthOfStayDays: number;
  previousPeriodAdmissions: number;
  intakeChangePercent: number;
}

export interface ResidentTrendPoint {
  bucket: string;
  label: string;
  newResidents: number;
  activeResidents: number;
}

export interface ResidentStatusSlice {
  label: string;
  count: number;
  percentage: number;
}

export interface ResidentLengthOfStayBucket {
  label: string;
  minDays: number;
  maxDays: number;
  count: number;
}

export interface ResidentOutcomeBar {
  label: string;
  count: number;
  percentage: number;
}

export interface ResidentExitPathway {
  label: string;
  count: number;
  percentage: number;
}

export interface ResidentFilterOption {
  id: string;
  label: string;
}

export interface ResidentFilterOptions {
  statuses: string[];
  caseCategories: string[];
  safehouses: ResidentFilterOption[];
  earliestAdmissionDate: string;
  latestAdmissionDate: string;
}
