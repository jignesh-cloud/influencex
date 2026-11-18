import { z } from "zod";

export const createSavedViewSchema = z.object({
  name: z.string().trim().min(1, "View name is required").max(100),
  pageScope: z.enum(["campaign_dashboard", "all_campaign_dashboards", "creator_directory"]),
  campaignId: z.string().optional(),
  // Shape depends on pageScope — campaign_dashboard/all_campaign_dashboards
  // store { visibility, order }; creator_directory stores {} (unused).
  columnConfig: z.record(z.string(), z.unknown()).default({}),
  sortConfig: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([]),
  // campaign dashboard: { globalFilter }. creator directory: the search params.
  filterConfig: z.record(z.string(), z.unknown()).default({}),
});

export type CreateSavedViewInput = z.infer<typeof createSavedViewSchema>;
