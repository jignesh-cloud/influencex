import { MockAffiliateProviderBase } from "@/services/affiliate/mock-base-provider";
import type { AffiliateNetworkName } from "@/services/affiliate/types";

/** MOCK — replace with AvantLink's Affiliate API (https://classic.avantlink.com/api.php) once credentials exist. */
export class AvantLinkAffiliateProvider extends MockAffiliateProviderBase {
  readonly network: AffiliateNetworkName = "avantlink";
  protected readonly inviteDomain = "mock-avantlink.example.com";
  protected readonly trackingDomain = "mock-avantlink-track.example.com";
}
