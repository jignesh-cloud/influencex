export type FitTier = "strong_match" | "partial_match" | "poor_match";

export interface CreatorFitCampaignContext {
  clientName: string;
  product: string | null;
  nicheKeywords: string[];
  targetCreatorLocations: string[];
  targetAudienceLocations: string[];
  audienceDemographics: unknown;
  contentStyle: string | null;
  deliverables: string | null;
  excludedContentTypes: string[];
  contentGuidelineRules: string[];
}

export interface CreatorFitCreatorContext {
  name: string;
  verticalTags: string[];
  interests: string[];
  brandAffinities: string[];
  location: string | null;
  audienceDemographics: unknown;
  followers: number | null;
  engagementRate: number | null;
  credibilityScore: number | null;
}

export interface CreatorFitResult {
  tier: FitTier;
  explanation: string;
}

/**
 * AI abstraction — never call OpenAI directly from application code. Behind
 * this interface so the provider can be swapped (or mocked for local dev)
 * via AI_PROVIDER without touching call sites.
 */
export interface AIProvider {
  scoreCreatorFit(campaign: CreatorFitCampaignContext, creator: CreatorFitCreatorContext): Promise<CreatorFitResult>;
}
