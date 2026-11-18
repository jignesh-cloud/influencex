import { MockAffiliateProviderBase } from "@/services/affiliate/mock-base-provider";
import type { AffiliateNetworkName } from "@/services/affiliate/types";

/** MOCK — replace with Awin's Publisher/Advertiser API (https://developer.awin.com) once credentials exist. */
export class AwinAffiliateProvider extends MockAffiliateProviderBase {
  readonly network: AffiliateNetworkName = "awin";
  protected readonly inviteDomain = "mock-awin.example.com";
  protected readonly trackingDomain = "mock-awin-track.example.com";
}
