import { post } from "./api";

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
