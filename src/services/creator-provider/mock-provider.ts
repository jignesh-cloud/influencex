import { MOCK_CREATORS } from "@/services/creator-provider/mock-data";
import type {
  CreatorProvider,
  CreatorProviderRecord,
  CreatorSearchInput,
  CreatorSearchOutput,
  CreatorSearchResult,
  Platform,
} from "@/services/creator-provider/types";

function followersForPlatform(record: CreatorProviderRecord, platform: Platform): number | null {
  if (platform === "instagram") return record.instagramFollowers ?? null;
  if (platform === "tiktok") return record.tiktokFollowers ?? null;
  return record.youtubeFollowers ?? null;
}

function engagementForPlatform(record: CreatorProviderRecord, platform: Platform): number | null {
  if (platform === "instagram") return record.instagramEngagementRate ?? null;
  if (platform === "tiktok") return record.tiktokEngagementRate ?? null;
  return record.youtubeEngagementRate ?? null;
}

function representativeFollowers(record: CreatorProviderRecord): number | null {
  return record.instagramFollowers ?? record.tiktokFollowers ?? record.youtubeFollowers ?? null;
}

function representativeEngagement(record: CreatorProviderRecord): number | null {
  if (record.instagramFollowers !== undefined && record.instagramFollowers !== null) {
    return record.instagramEngagementRate ?? null;
  }
  if (record.tiktokFollowers !== undefined && record.tiktokFollowers !== null) {
    return record.tiktokEngagementRate ?? null;
  }
  return record.youtubeEngagementRate ?? null;
}

function matches(record: CreatorProviderRecord, input: CreatorSearchInput): boolean {
  if (input.platform) {
    const followers = followersForPlatform(record, input.platform);
    if (followers === null) return false;
  }

  const followers = input.platform ? followersForPlatform(record, input.platform) : representativeFollowers(record);
  if (input.followerMin !== undefined && (followers === null || followers < input.followerMin)) return false;
  if (input.followerMax !== undefined && (followers === null || followers > input.followerMax)) return false;

  const engagement = input.platform ? engagementForPlatform(record, input.platform) : representativeEngagement(record);
  if (input.engagementRateMin !== undefined && (engagement === null || engagement < input.engagementRateMin)) {
    return false;
  }

  if (input.vertical && !record.verticalTags?.some((tag) => tag.toLowerCase() === input.vertical!.toLowerCase())) {
    return false;
  }

  if (input.location && record.location?.toLowerCase() !== input.location.toLowerCase()) return false;

  if (
    input.audienceLocation &&
    !record.audienceLocations?.some((loc) => loc.toLowerCase() === input.audienceLocation!.toLowerCase())
  ) {
    return false;
  }

  if (input.ageMin !== undefined && (record.age === null || record.age === undefined || record.age < input.ageMin)) {
    return false;
  }
  if (input.ageMax !== undefined && (record.age === null || record.age === undefined || record.age > input.ageMax)) {
    return false;
  }

  if (input.gender && record.gender?.toLowerCase() !== input.gender.toLowerCase()) return false;

  if (input.keyword) {
    const haystack = [record.name, ...(record.interests ?? []), ...(record.verticalTags ?? [])]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(input.keyword.toLowerCase())) return false;
  }

  return true;
}

export class MockCreatorProvider implements CreatorProvider {
  async searchCreators(input: CreatorSearchInput): Promise<CreatorSearchOutput> {
    const results = MOCK_CREATORS.filter((record) => matches(record, input));
    return { results, total: results.length };
  }

  async getCreator(externalId: string): Promise<CreatorProviderRecord | null> {
    return MOCK_CREATORS.find((record) => record.externalId === externalId) ?? null;
  }

  async findSimilarCreators(externalId: string, filters?: CreatorSearchInput): Promise<CreatorSearchResult[]> {
    const source = await this.getCreator(externalId);
    if (!source) return [];

    return MOCK_CREATORS.filter((record) => {
      if (record.externalId === externalId) return false;
      const sameVertical = record.verticalTags?.some((tag) => source.verticalTags?.includes(tag));
      if (!sameVertical) return false;
      return matches(record, filters ?? {});
    });
  }

  async refreshCreator(externalId: string): Promise<CreatorProviderRecord | null> {
    // Mock: real adapters would re-fetch live metrics from the vendor API here.
    return this.getCreator(externalId);
  }
}
