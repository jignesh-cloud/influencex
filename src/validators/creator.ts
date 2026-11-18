import { z } from "zod";

const BLOCK_REASONS = [
  "inappropriate_or_offensive_content",
  "fraudulent_followers_or_engagement",
  "brand_safety_concern",
  "unprofessional_conduct",
  "previous_campaign_issue",
  "legal_or_compliance_concern",
  "do_not_contact",
  "other",
] as const;

export const blockCreatorSchema = z.object({
  reason: z.enum(BLOCK_REASONS),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type BlockCreatorInput = z.infer<typeof blockCreatorSchema>;
export { BLOCK_REASONS };
