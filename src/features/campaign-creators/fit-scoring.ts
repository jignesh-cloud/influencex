import { prisma } from "@/db/prisma";
import { aiProvider } from "@/services/ai";
import type { CreatorFitCampaignContext, CreatorFitCreatorContext } from "@/services/ai";
import { logActivity } from "@/services/activity-log/log-activity";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function representativeFollowers(creator: {
  instagramFollowers: number | null;
  tiktokFollowers: number | null;
  youtubeFollowers: number | null;
}): number | null {
  return creator.instagramFollowers ?? creator.tiktokFollowers ?? creator.youtubeFollowers ?? null;
}

function representativeEngagement(creator: {
  instagramFollowers: number | null;
  tiktokFollowers: number | null;
  youtubeFollowers: number | null;
  instagramEngagementRate: number | null;
  tiktokEngagementRate: number | null;
  youtubeEngagementRate: number | null;
}): number | null {
  if (creator.instagramFollowers !== null) return creator.instagramEngagementRate;
  if (creator.tiktokFollowers !== null) return creator.tiktokEngagementRate;
  if (creator.youtubeFollowers !== null) return creator.youtubeEngagementRate;
  return null;
}

/**
 * CreatorFitScoringService — the only place that calls the AI provider for
 * fit scoring. Never let this throw into its caller: a scoring failure must
 * not block adding a creator to a campaign (see architecture §"API Error
 * Handling" — log, don't silently fail, but also don't hard-block on it).
 */
export async function scoreCreatorFitForCampaignCreator(campaignCreatorId: string) {
  const row = await prisma.campaignCreator.findUniqueOrThrow({
    where: { id: campaignCreatorId },
    include: {
      campaign: { include: { client: { select: { name: true } }, contentGuidelineTemplate: true } },
      creator: true,
    },
  });

  const campaignContext: CreatorFitCampaignContext = {
    clientName: row.campaign.client.name,
    product: row.campaign.product,
    nicheKeywords: asStringArray(row.campaign.nicheKeywords),
    targetCreatorLocations: asStringArray(row.campaign.targetCreatorLocations),
    targetAudienceLocations: asStringArray(row.campaign.targetAudienceLocations),
    audienceDemographics: row.campaign.audienceDemographics,
    contentStyle: row.campaign.contentStyle,
    deliverables: row.campaign.deliverables,
    excludedContentTypes: asStringArray(row.campaign.excludedContentTypes),
    contentGuidelineRules: asStringArray(row.campaign.contentGuidelineTemplate?.rules),
  };

  const creatorContext: CreatorFitCreatorContext = {
    name: row.creator.name,
    verticalTags: asStringArray(row.creator.verticalTags),
    interests: asStringArray(row.creator.interests),
    brandAffinities: asStringArray(row.creator.brandAffinities),
    location: row.creator.location,
    audienceDemographics: row.creator.audienceDemographics,
    followers: representativeFollowers(row.creator),
    engagementRate: representativeEngagement(row.creator),
    credibilityScore: row.creator.credibilityScore,
  };

  try {
    const result = await aiProvider.scoreCreatorFit(campaignContext, creatorContext);

    await prisma.campaignCreator.update({
      where: { id: campaignCreatorId },
      data: { aiFitScore: result.tier, aiFitExplanation: result.explanation },
    });

    await logActivity({
      entityType: "campaign_creator",
      entityId: campaignCreatorId,
      actorType: "system",
      action: "ai_fit_scored",
      detail: { message: `AI scored ${row.creator.name}: ${result.tier}`, tier: result.tier },
    });

    return { success: true as const, result };
  } catch (error) {
    console.error(`[CreatorFitScoringService] scoring failed for ${campaignCreatorId}:`, error);

    await logActivity({
      entityType: "campaign_creator",
      entityId: campaignCreatorId,
      actorType: "system",
      action: "ai_fit_scoring_failed",
      detail: { message: `AI fit scoring failed for ${row.creator.name}`, error: String(error) },
    });

    return { success: false as const, error: "AI fit scoring failed. You can retry or set the score manually." };
  }
}
