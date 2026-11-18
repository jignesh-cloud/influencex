import { MockAffiliateProviderBase } from "@/services/affiliate/mock-base-provider";
import type { AffiliateNetworkName } from "@/services/affiliate/types";

/** MOCK — replace with Impact's Partner API (https://api.impact.com) once credentials exist. */
export class ImpactAffiliateProvider extends MockAffiliateProviderBase {
  readonly network: AffiliateNetworkName = "impact";
  protected readonly inviteDomain = "mock-impact.example.com";
  protected readonly trackingDomain = "mock-impact-track.example.com";
}
