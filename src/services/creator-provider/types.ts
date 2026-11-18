export type Platform = "instagram" | "tiktok" | "youtube";

export interface CreatorProviderRecord {
  externalId: string;
  name: string;
  email?: string | null;
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
  youtubeHandle?: string | null;
  instagramFollowers?: number | null;
  tiktokFollowers?: number | null;
  youtubeFollowers?: number | null;
  instagramEngagementRate?: number | null;
  tiktokEngagementRate?: number | null;
  youtubeEngagementRate?: number | null;
  averageLikes?: number | null;
  averageViews?: number | null;
  credibilityScore?: number | null;
  location?: string | null;
  age?: number | null;
  gender?: string | null;
  interests?: string[];
  brandAffinities?: string[];
  audienceDemographics?: Record<string, unknown>;
  exampleContent?: unknown[];
  verticalTags?: string[];
  audienceLocations?: string[];
  contentFlagged?: boolean;
}

export type CreatorSearchResult = CreatorProviderRecord;

export interface CreatorSearchInput {
  keyword?: string;
  vertical?: string;
  platform?: Platform;
  location?: string;
  audienceLocation?: string;
  followerMin?: number;
  followerMax?: number;
  engagementRateMin?: number;
  ageMin?: number;
  ageMax?: number;
  gender?: string;
}

export interface CreatorSearchOutput {
  results: CreatorSearchResult[];
  total: number;
}

/**
 * Provider abstraction — never couple the app to one vendor. MockCreatorProvider
 * is the only implementation until a real vendor is selected (see architecture
 * doc §risks: real vendors may have data-retention/redistribution restrictions
 * that must be checked before permanent storage).
 */
export interface CreatorProvider {
  searchCreators(input: CreatorSearchInput): Promise<CreatorSearchOutput>;
  getCreator(externalId: string): Promise<CreatorProviderRecord | null>;
  findSimilarCreators(externalId: string, filters?: CreatorSearchInput): Promise<CreatorSearchResult[]>;
  refreshCreator(externalId: string): Promise<CreatorProviderRecord | null>;
}

export const FOLLOWER_TIERS = {
  nano: { label: "Nano (1K–10K)", min: 1_000, max: 10_000 },
  micro: { label: "Micro (10K–100K)", min: 10_000, max: 100_000 },
  mid: { label: "Mid (100K–500K)", min: 100_000, max: 500_000 },
  macro: { label: "Macro (500K–1M)", min: 500_000, max: 1_000_000 },
  mega: { label: "Mega (1M+)", min: 1_000_000, max: undefined },
} as const;
