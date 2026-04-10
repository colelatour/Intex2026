export interface DashboardKpis {
  activeResidents: number;
  donationsThisMonth: number;
  donationsLastMonth: number;
  upcomingConferences: number;
  atRiskResidents: number;
  totalReferrals: number;
}

export interface CaseloadRow {
  residentId: string;
  safehouseId: string | null;
  safehouseName: string | null;
  caseType: string | null;
  worker: string | null;
  status: string;
}

export interface ActivityItem {
  type: string;
  text: string;
  timestamp: string;
}

export interface DonationMonth {
  year: number;
  month: number;
  total: number;
}

export interface OutcomeSlice {
  label: string;
  count: number;
}

export interface UpcomingEvent {
  date: string;
  title: string;
  location: string | null;
}

export interface DashboardDonationsOverview {
  rangeStart: string;
  rangeEnd: string;
  totalInRange: number;
  donationCount: number;
  donorCount: number;
  percentChangeFromPreviousPeriod: number;
}

export interface DashboardUtilizationMarker {
  safehouseId: string;
  name: string;
  utilizationPct: number;
}

export interface DashboardSafehousesOverview {
  rangeStart: string;
  rangeEnd: string;
  totalSafehouses: number;
  averageOccupancyRate: number;
  highestUtilization: DashboardUtilizationMarker | null;
  lowestUtilization: DashboardUtilizationMarker | null;
  totalResidentsHoused: number;
  turnoverRate: number;
}

export interface DashboardResidentsOverview {
  rangeStart: string;
  rangeEnd: string;
  totalResidentsInRange: number;
  activeResidents: number;
  completionRate: number;
  intakeChangePercent: number;
}

export interface DashboardReportsOverview {
  donations: DashboardDonationsOverview;
  residents: DashboardResidentsOverview;
  safehouses: DashboardSafehousesOverview;
}

export interface DashboardResponse {
  serverTimeUtc: string;
  kpis: DashboardKpis;
  caseload: CaseloadRow[];
  activity: ActivityItem[];
  donationsMonthly: DonationMonth[];
  residentOutcomes: OutcomeSlice[];
  upcomingEvents: UpcomingEvent[];
  reportsOverview: DashboardReportsOverview;
}
