import { prisma } from "@/db/prisma";
import type { SavedViewPageScope } from "@/generated/prisma/enums";

export async function getSavedViewsForUser(userId: string, pageScope: SavedViewPageScope, campaignId?: string) {
  return prisma.savedView.findMany({
    where: {
      userId,
      OR:
        pageScope === "campaign_dashboard" && campaignId
          ? [{ pageScope: "campaign_dashboard", campaignId }, { pageScope: "all_campaign_dashboards" }]
          : [{ pageScope }],
    },
    orderBy: { name: "asc" },
  });
}
