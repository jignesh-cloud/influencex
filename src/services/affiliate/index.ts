import { ImpactAffiliateProvider } from "@/services/affiliate/impact-provider";
import { AwinAffiliateProvider } from "@/services/affiliate/awin-provider";
import { AvantLinkAffiliateProvider } from "@/services/affiliate/avantlink-provider";
import type { AffiliateNetworkName, AffiliateProvider } from "@/services/affiliate/types";

const providers: Record<AffiliateNetworkName, AffiliateProvider> = {
  impact: new ImpactAffiliateProvider(),
  awin: new AwinAffiliateProvider(),
  avantlink: new AvantLinkAffiliateProvider(),
};

/**
 * Every network is currently a mock adapter (env.AFFILIATE_*_MODE exists for
 * when real credentials are wired in — each adapter checks its own mode
 * once real API calls are implemented). Call sites never branch on network
 * directly; they always go through this factory.
 */
export function getAffiliateProvider(network: AffiliateNetworkName): AffiliateProvider {
  return providers[network];
}

export * from "@/services/affiliate/types";
