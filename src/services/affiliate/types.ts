export type AffiliateNetworkName = "impact" | "awin" | "avantlink";

export type EnrollmentStatus = "invite_created" | "invited" | "applied" | "enrolled" | "inactive";

export interface AffiliateEnrollmentContext {
  networkProgramId: string | null;
  externalEnrollmentRef: string | null;
  creatorName: string;
  creatorEmail: string | null;
  /** Current known status, so a provider can report the *next* real-world stage. */
  currentStatus: EnrollmentStatus;
}

export interface AffiliateInviteResult {
  inviteLink: string;
  externalEnrollmentRef: string;
}

export interface AffiliatePerformance {
  conversionRate: number | null;
  gmv: number | null;
  payoutStatus: string | null;
}

/**
 * Common interface across affiliate networks. The network remains the
 * source of truth for commission tracking and payouts — this only mirrors
 * it (see architecture §"Out of Scope": no payout engine here).
 */
export interface AffiliateProvider {
  readonly network: AffiliateNetworkName;
  createInviteLink(context: AffiliateEnrollmentContext): Promise<AffiliateInviteResult>;
  getEnrollmentStatus(context: AffiliateEnrollmentContext): Promise<EnrollmentStatus>;
  getTrackingLink(context: AffiliateEnrollmentContext): Promise<string | null>;
  getPerformance(context: AffiliateEnrollmentContext): Promise<AffiliatePerformance>;
}
