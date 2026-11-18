import { z } from "zod";

const PLATFORMS = ["instagram", "tiktok", "youtube"] as const;

// gifting_only removed from campaign builder per client feedback — the enum
// value still exists in the DB for backward compatibility, just not offered
// as a selectable default here.
const COMPENSATION_TYPES = ["commission_only", "flat_fee", "flat_fee_plus_commission"] as const;

// Fixed option set — matches the mock creator provider's location data.
// Expand this list once a real creator-data provider is wired in.
const CREATOR_LOCATION_OPTIONS = ["United States", "Canada", "United Kingdom", "Australia"] as const;

const CONTENT_FORMAT_OPTIONS = ["Reel", "Carousel", "Story", "Feed Post"] as const;

const USAGE_RIGHTS_DURATION_OPTIONS = ["90 days", "6 months", "1 year"] as const;

/** Parses a comma-separated input string into a trimmed, non-empty array. */
export function csvToArray(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const createCampaignSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required").max(200),
  product: z.string().trim().max(300).optional().or(z.literal("")),
  platforms: z.array(z.enum(PLATFORMS)).default([]),
  nicheKeywords: z.array(z.string()).default([]),
  targetCreatorLocations: z.array(z.enum(CREATOR_LOCATION_OPTIONS)).default([]),
  followerSizeMin: z.number().int().nonnegative().optional(),
  followerSizeMax: z.number().int().positive().optional(),
  contentStyle: z.array(z.enum(CONTENT_FORMAT_OPTIONS)).default([]),
  deliverables: z.string().trim().max(2000).optional().or(z.literal("")),
  defaultCompensationType: z.enum(COMPENSATION_TYPES).optional().or(z.literal("")),
  usageRightsExpectations: z.enum(USAGE_RIGHTS_DURATION_OPTIONS).optional().or(z.literal("")),
  excludedContentTypes: z.array(z.string()).default([]),
  defaultAffiliateProgramId: z.string().optional().or(z.literal("")),
  contentGuidelineTemplateId: z.string().optional().or(z.literal("")),
  showPricingToClient: z.boolean().default(false),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export {
  PLATFORMS,
  COMPENSATION_TYPES,
  CREATOR_LOCATION_OPTIONS,
  CONTENT_FORMAT_OPTIONS,
  USAGE_RIGHTS_DURATION_OPTIONS,
};
