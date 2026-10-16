/** Coach xác minh sàng lọc an toàn (ASSESSMENT_FRAMEWORK_V2 §3.5, §38). Khớp ClearanceDto / ClearanceDetailDto của backend. */

export type SafetyClearanceStatus = "REQUESTED" | "UNDER_REVIEW" | "GRANTED" | "REJECTED";
export type SafetyStatusCode = "CLEARED" | "REVIEW_REQUIRED" | "RESTRICTED";

export interface SafetyClearance {
  id: number;
  userId: number;
  method: string;
  status: SafetyClearanceStatus;
  decidedByType: string | null;
  resultingStatus: SafetyStatusCode | null;
  requestedAt: string;
  reviewedAt: string | null;
  note: string | null;
  evidenceRef: string | null;
  removedFlags: string[];
}

export interface SafetyActiveFlag { code: string; sticky: boolean; severity: string }

export interface SafetyResultingOption { resultingStatus: SafetyStatusCode; allowRetainedConstraints: boolean }

/** currentStatus = null khi học viên không còn trạng thái an toàn hiện hành. stale = trạng thái đã đổi kể từ khi gửi yêu cầu. */
export interface SafetyClearanceDetail {
  clearance: SafetyClearance;
  userName: string | null;
  currentStatus: SafetyStatusCode | null;
  stale: boolean;
  validUntil: string | null;
  activeFlags: SafetyActiveFlag[];
  constraints: string[];
  retainableConstraints: string[];
  acknowledged: boolean;
  canDecide: boolean;
  options: SafetyResultingOption[];
}

export interface SafetyDecisionInput {
  id: number;
  decision: "GRANTED" | "REJECTED";
  resultingStatus?: SafetyStatusCode;
  retainedConstraints?: string[];
  note: string;
}
