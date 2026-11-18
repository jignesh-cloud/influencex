import { env } from "@/lib/env";
import { MockHubSpotService } from "@/services/hubspot/mock-hubspot-service";
import { HubSpotServiceImpl } from "@/services/hubspot/hubspot-service";
import type { HubSpotService } from "@/services/hubspot/types";

function createHubSpotService(): HubSpotService {
  return env.HUBSPOT_MODE === "live" ? new HubSpotServiceImpl() : new MockHubSpotService();
}

export const hubSpotService = createHubSpotService();

export * from "@/services/hubspot/types";
