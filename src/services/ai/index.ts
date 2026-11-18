import { env } from "@/lib/env";
import { MockAIProvider } from "@/services/ai/mock-provider";
import { OpenAIProvider } from "@/services/ai/openai-provider";
import type { AIProvider } from "@/services/ai/types";

/**
 * Factory keyed off AI_PROVIDER. The OpenAI client is only constructed when
 * actually selected, so a mock-only setup never requires an API key.
 */
function createAIProvider(): AIProvider {
  switch (env.AI_PROVIDER) {
    case "openai":
      return new OpenAIProvider();
    case "mock":
    default:
      return new MockAIProvider();
  }
}

export const aiProvider = createAIProvider();

export * from "@/services/ai/types";
