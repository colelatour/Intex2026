export interface DonationReportFilters {
  startDate: string;
  endDate: string;
  minAmount: number | null;
  maxAmount: number | null;
  campaign: string | null;
  breakdown: string;
}

export interface DonationReportSummary {
  filters: DonationReportFilters;
  totalDonationsLifetime: number;
  totalDonationsInRange: number;
  donationCount: number;
  donorCount: number;
  averageDonation: number;
  medianDonation: number;
  previousPeriodTotal: number;
  percentChangeFromPreviousPeriod: number;
}

export interface DonationTrendPoint {
  bucket: string;
  label: string;
  totalAmount: number;
  donationCount: number;
}

export interface DonationDistributionBucket {
  label: string;
  minAmount: number;
  maxAmount: number;
  donationCount: number;
  totalAmount: number;
}

export interface DonationBreakdownSlice {
  label: string;
  totalAmount: number;
  donationCount: number;
  percentage: number;
}

export interface TopContributor {
  supporterId: string;
  name: string;
  totalAmount: number;
  donationCount: number;
  primaryCampaign: string | null;
}

export interface DonationFilterOptions {
  campaigns: string[];
  suggestedMinAmount: number;
  suggestedMaxAmount: number;
}
