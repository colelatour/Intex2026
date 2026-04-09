export interface SafehouseReportFilters {
  startDate: string;
  endDate: string;
  safehouseId: string | null;
  region: string | null;
}

export interface SafehouseUtilizationMarker {
  safehouseId: string;
  name: string;
  utilizationPct: number;
}

export interface SafehouseSummary {
  filters: SafehouseReportFilters;
  totalSafehouses: number;
  averageOccupancyRate: number;
  highestUtilization: SafehouseUtilizationMarker | null;
  lowestUtilization: SafehouseUtilizationMarker | null;
  totalResidentsHoused: number;
  turnoverRate: number;
}

export interface SafehouseOccupancyPoint {
  bucket: string;
  label: string;
  activeResidents: number;
  averageUtilizationPct: number;
}

export interface SafehouseComparisonRow {
  safehouseId: string;
  safehouseName: string;
  region: string;
  capacity: number;
  currentOccupancy: number;
  utilizationPct: number;
  admissions: number;
  exits: number;
  averageLengthOfStayDays: number;
  completionRate: number;
  turnoverRate: number;
}

export interface SafehouseOutcomeRow {
  safehouseId: string;
  safehouseName: string;
  completedResidents: number;
  totalResidents: number;
  completionRate: number;
}

export interface SafehouseFlowRow {
  safehouseId: string;
  safehouseName: string;
  entries: number;
  exits: number;
}

export interface SafehouseFilterOption {
  id: string;
  label: string;
}

export interface SafehouseFilterOptions {
  safehouses: SafehouseFilterOption[];
  regions: string[];
  earliestDate: string;
  latestDate: string;
}
