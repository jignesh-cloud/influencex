import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { env } from "@/lib/env";
import { callExternalService } from "@/lib/external-service";
import type {
  AIProvider,
  CreatorFitCampaignContext,
  CreatorFitCreatorContext,
  CreatorFitResult,
} from "@/services/ai/types";

const FitResultSchema = z.object({
  tier: z.enum(["strong_match", "partial_match", "poor_match"]),
  explanation: z.string(),
});

function buildPrompt(campaign: CreatorFitCampaignContext, creator: CreatorFitCreatorContext): string {
  return [
    `Campaign for client "${campaign.clientName}":`,
    `- Product: ${campaign.product ?? "not specified"}`,
    `- Niche/keywords: ${campaign.nicheKeywords.join(", ") || "none specified"}`,
    `- Target creator locations: ${campaign.targetCreatorLocations.join(", ") || "any"}`,
    `- Target audience locations: ${campaign.targetAudienceLocations.join(", ") || "any"}`,
    `- Target audience demographics: ${JSON.stringify(campaign.audienceDemographics)}`,
    `- Desired content style: ${campaign.contentStyle ?? "not specified"}`,
    `- Deliverables: ${campaign.deliverables ?? "not specified"}`,
    `- Excluded content types: ${campaign.excludedContentTypes.join(", ") || "none"}`,
    `- Content guidelines: ${campaign.contentGuidelineRules.join("; ") || "none on file"}`,
    "",
    `Candidate creator: ${creator.name}`,
    `- Vertical tags: ${creator.verticalTags.join(", ") || "none"}`,
    `- Interests: ${creator.interests.join(", ") || "none"}`,
    `- Brand affinities: ${creator.brandAffinities.join(", ") || "none"}`,
    `- Location: ${creator.location ?? "unknown"}`,
    `- Audience demographics: ${JSON.stringify(creator.audienceDemographics)}`,
    `- Followers: ${creator.followers ?? "unknown"}`,
    `- Engagement rate: ${creator.engagementRate ?? "unknown"}%`,
    `- Credibility score: ${creator.credibilityScore ?? "unknown"}`,
    "",
    "Evaluate how well this creator fits this campaign. Consider niche/keyword alignment, location targeting, content style fit, and whether the creator's content overlaps with any excluded content types or violates the content guidelines. Respond with a tier and a short, plain-language explanation a Group 8A team member can read at a glance.",
  ].join("\n");
}

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  async scoreCreatorFit(
    campaign: CreatorFitCampaignContext,
    creator: CreatorFitCreatorContext,
  ): Promise<CreatorFitResult> {
    const response = await callExternalService("openai.creatorFitScoring", () =>
      this.client.responses.parse({
        model: env.OPENAI_MODEL,
        input: buildPrompt(campaign, creator),
        text: { format: zodTextFormat(FitResultSchema, "creator_fit") },
      }),
    );

    if (!response.output_parsed) {
      throw new Error("OpenAI response did not include parsed structured output.");
    }

    return response.output_parsed;
  }
}
