"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/services/activity-log/log-activity";
import { createCampaignSchema, type CreateCampaignInput } from "@/validators/campaign";

export async function createCampaign(clientId: string, input: CreateCampaignInput) {
  const user = await requireUser();
  const parsed = createCampaignSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const data = parsed.data;

  const campaign = await prisma.campaign.create({
    data: {
      clientId,
      name: data.name,
      product: data.product || null,
      platforms: data.platforms,
      nicheKeywords: data.nicheKeywords,
      targetCreatorLocations: data.targetCreatorLocations,
      followerSizeMin: data.followerSizeMin ?? null,
      followerSizeMax: data.followerSizeMax ?? null,
      // Stored as a comma-joined string — Campaign.contentStyle is still a
      // plain text column; the builder now collects it as a fixed multi-select.
      contentStyle: data.contentStyle.length > 0 ? data.contentStyle.join(", ") : null,
      deliverables: data.deliverables || null,
      defaultCompensationType: data.defaultCompensationType || null,
      usageRightsExpectations: data.usageRightsExpectations || null,
      excludedContentTypes: data.excludedContentTypes,
      defaultAffiliateProgramId: data.defaultAffiliateProgramId || null,
      contentGuidelineTemplateId: data.contentGuidelineTemplateId || null,
      clientFeedbackDisplaySettings: { showPricing: data.showPricingToClient },
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      createdById: user.id,
    },
  });

  await logActivity({
    entityType: "campaign",
    entityId: campaign.id,
    actorType: "user",
    actorId: user.id,
    actorName: user.name,
    action: "campaign_created",
    detail: { message: `New campaign created: ${campaign.name}` },
  });

  revalidatePath(`/clients/${clientId}`);
  redirect(`/campaigns/${campaign.id}`);
}
