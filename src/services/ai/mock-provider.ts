import type {
  AIProvider,
  CreatorFitCampaignContext,
  CreatorFitCreatorContext,
  CreatorFitResult,
  FitTier,
} from "@/services/ai/types";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

const US_STATE_ABBREVIATIONS = new Set([
  "al", "ak", "az", "ar", "ca", "co", "ct", "de", "fl", "ga", "hi", "id", "il", "in", "ia", "ks",
  "ky", "la", "me", "md", "ma", "mi", "mn", "ms", "mo", "mt", "ne", "nv", "nh", "nj", "nm", "ny",
  "nc", "nd", "oh", "ok", "or", "pa", "ri", "sc", "sd", "tn", "tx", "ut", "vt", "va", "wa", "wv",
  "wi", "wy",
]);

/**
 * Free-text creator locations ("Austin, TX") vs. coarser campaign targets
 * ("United States") don't line up on exact string equality — a real
 * provider would give structured country/region fields. This mock
 * approximates it: substring match, or a "City, ST" pattern implying the US.
 */
function locationMatches(creatorLocation: string, targetLocation: string): boolean {
  const creator = normalize(creatorLocation);
  const target = normalize(targetLocation);
  if (creator.includes(target) || target.includes(creator)) return true;

  if (target === "united states" || target === "usa" || target === "u.s." || target === "us") {
    const stateAbbrMatch = /,\s*([a-z]{2})$/i.exec(creatorLocation.trim());
    if (stateAbbrMatch && US_STATE_ABBREVIATIONS.has(stateAbbrMatch[1].toLowerCase())) return true;
  }

  return false;
}

/**
 * Deterministic, rule-based scorer — no API calls, no cost. Used for local
 * dev and whenever AI_PROVIDER=mock. Not a substitute for the real model's
 * judgment, but exercises the exact same interface/storage/override paths.
 */
export class MockAIProvider implements AIProvider {
  async scoreCreatorFit(
    campaign: CreatorFitCampaignContext,
    creator: CreatorFitCreatorContext,
  ): Promise<CreatorFitResult> {
    let score = 0;
    const reasons: string[] = [];
    const concerns: string[] = [];

    const creatorTags = [...creator.verticalTags, ...creator.interests].map(normalize);
    const nicheKeywords = campaign.nicheKeywords.map(normalize);
    const matchedNiche = nicheKeywords.filter((keyword) => creatorTags.some((tag) => tag.includes(keyword) || keyword.includes(tag)));

    if (matchedNiche.length > 0) {
      score += 2;
      reasons.push(`aligns with the campaign's niche (${matchedNiche.join(", ")})`);
    } else if (nicheKeywords.length > 0) {
      concerns.push("doesn't clearly overlap with the campaign's niche/keywords");
    }

    if (campaign.targetCreatorLocations.length > 0) {
      const locationMatch = creator.location
        ? campaign.targetCreatorLocations.some((loc) => locationMatches(creator.location!, loc))
        : false;
      if (locationMatch) {
        score += 1;
        reasons.push(`is based in a targeted creator location (${creator.location})`);
      } else {
        concerns.push(`creator location (${creator.location ?? "unknown"}) is outside the campaign's target locations`);
      }
    }

    const excludedHit = campaign.excludedContentTypes
      .map(normalize)
      .find((excluded) => creatorTags.some((tag) => tag.includes(excluded)));
    if (excludedHit) {
      score -= 3;
      concerns.push(`overlaps with an excluded content type ("${excludedHit}")`);
    }

    if (creator.engagementRate !== null && creator.engagementRate >= 4) {
      score += 1;
      reasons.push(`has above-average engagement (${creator.engagementRate.toFixed(1)}%)`);
    }

    // A client-specific exclusion conflict is a hard business-rule violation,
    // not just one input among several — it overrides any positive score.
    let tier: FitTier;
    if (excludedHit) tier = "poor_match";
    else if (score >= 3) tier = "strong_match";
    else if (score >= 1) tier = "partial_match";
    else tier = "poor_match";

    const parts: string[] = [];
    if (reasons.length > 0) parts.push(`${creator.name} ${reasons.join(" and ")}.`);
    if (concerns.length > 0) parts.push(`However, ${concerns.join("; ")}.`);
    if (parts.length === 0) parts.push(`Not enough signal to strongly match or rule out ${creator.name} for this campaign.`);

    return { tier, explanation: parts.join(" ") };
  }
}
