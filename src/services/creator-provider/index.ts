import { env } from "@/lib/env";
import { MockCreatorProvider } from "@/services/creator-provider/mock-provider";
import type { CreatorProvider } from "@/services/creator-provider/types";

/**
 * Factory keyed off CREATOR_PROVIDER. Swapping in a real vendor later is a
 * new adapter file + one branch here — no call-site changes.
 */
function createCreatorProvider(): CreatorProvider {
  switch (env.CREATOR_PROVIDER) {
    case "mock":
    default:
      return new MockCreatorProvider();
  }
}

export const creatorProvider = createCreatorProvider();
export const CREATOR_PROVIDER_NAME = env.CREATOR_PROVIDER;

export * from "@/services/creator-provider/types";
