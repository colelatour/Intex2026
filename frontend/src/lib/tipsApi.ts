import { post } from "./api";

export interface SubmitTipRequest {
  name: string;
  email: string;
  region: string;
}

export interface SubmitTipResponse {
  tipId: number;
  submittedAt: string;
}

export function submitTip(payload: SubmitTipRequest): Promise<SubmitTipResponse> {
  return post<SubmitTipResponse>("/api/tips", payload);
}
