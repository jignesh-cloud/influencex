import crypto from "node:crypto";
import type {
  AffiliateEnrollmentContext,
  AffiliateInviteResult,
  AffiliateNetworkName,
  AffiliatePerformance,
  AffiliateProvider,
  EnrollmentStatus,
} from "@/services/affiliate/types";

/**
 * "invited" is caused by us sending the HubSpot invite (see
 * features/campaign-creators/invite.ts), not something the network reports —
 * so a status sync cannot advance past invite_created on its own.
 */
const NEXT_STATUS: Record<EnrollmentStatus, EnrollmentStatus> = {
  invite_created: "invite_created",
  invited: "applied",
  applied: "enrolled",
  enrolled: "enrolled",
  inactive: "inactive",
};

/**
 * Shared mock behavior for all three network adapters — clearly marked
 * MOCK. Replace each subclass's methods with real API calls once
 * credentials are available; the call sites (enrollment service) never
 * need to change.
 *
 * getEnrollmentStatus deterministically advances one stage per call (rather
 * than returning random or static data) so the enrollment flow is actually
 * demonstrable end-to-end without a real network ever being wired up.
 */
export abstract class MockAffiliateProviderBase implements AffiliateProvider {
  abstract readonly network: AffiliateNetworkName;
  protected abstract readonly inviteDomain: string;
  protected abstract readonly trackingDomain: string;

  async createInviteLink(context: AffiliateEnrollmentContext): Promise<AffiliateInviteResult> {
    // MOCK — replace with a real invite/application-link request to this network's Partner API.
    void context;
    const ref = crypto.randomBytes(8).toString("hex");
    return {
      inviteLink: `https://${this.inviteDomain}/invite/${ref}`,
      externalEnrollmentRef: ref,
    };
  }

  async getEnrollmentStatus(context: AffiliateEnrollmentContext): Promise<EnrollmentStatus> {
    // MOCK — replace with a real enrollment-status lookup by externalEnrollmentRef.
    return NEXT_STATUS[context.currentStatus];
  }

  async getTrackingLink(context: AffiliateEnrollmentContext): Promise<string | null> {
    // MOCK — replace with a real tracking-link lookup. Networks only issue a
    // confirmed tracking link once the creator is actually enrolled, not
    // while an invite/application is still pending.
    if (context.currentStatus !== "enrolled" || !context.externalEnrollmentRef) return null;
    return `https://${this.trackingDomain}/track/${context.externalEnrollmentRef}`;
  }

  async getPerformance(context: AffiliateEnrollmentContext): Promise<AffiliatePerformance> {
    // MOCK — replace with a real performance pull. Deterministic fake values, not random.
    if (context.currentStatus !== "enrolled") {
      return { conversionRate: null, gmv: null, payoutStatus: null };
    }
    return { conversionRate: 2.4, gmv: 340.5, payoutStatus: "pending" };
  }
}
