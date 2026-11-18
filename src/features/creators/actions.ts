"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/db/prisma";
import { requireRole, requireUser, ForbiddenError } from "@/lib/auth";
import { logActivity } from "@/services/activity-log/log-activity";
import { blockCreatorSchema, type BlockCreatorInput } from "@/validators/creator";
import { creatorProvider } from "@/services/creator-provider";
import { upsertCreatorFromProviderRecord } from "@/services/creator-provider/ingest-creator";
import { scoreCreatorFitForCampaignCreator } from "@/features/campaign-creators/fit-scoring";

export async function blockCreatorGlobally(creatorId: string, input: BlockCreatorInput) {
  const user = await requireRole("admin");
  const parsed = blockCreatorSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const creator = await prisma.creator.update({
    where: { id: creatorId },
    data: {
      globalEligibilityStatus: "unfit_globally_blocked",
      globalBlockReason: parsed.data.reason,
      globalBlockNotes: parsed.data.notes || null,
      blockedById: user.id,
      blockedAt: new Date(),
      unblockedById: null,
      unblockedAt: null,
    },
  });

  await logActivity({
    entityType: "creator",
    entityId: creator.id,
    actorType: "user",
    actorId: user.id,
    actorName: user.name,
    action: "global_block",
    detail: { message: `${creator.name} blocked globally: ${parsed.data.reason}`, reason: parsed.data.reason },
  });

  revalidatePath("/creators");
  revalidatePath(`/creators/${creatorId}`);
  return { success: true };
}

export async function unblockCreatorGlobally(creatorId: string) {
  const user = await requireRole("admin");

  const creator = await prisma.creator.update({
    where: { id: creatorId },
    data: {
      globalEligibilityStatus: "eligible_for_future_campaigns",
      unblockedById: user.id,
      unblockedAt: new Date(),
    },
  });

  await logActivity({
    entityType: "creator",
    entityId: creator.id,
    actorType: "user",
    actorId: user.id,
    actorName: user.name,
    action: "global_unblock",
    detail: { message: `${creator.name} unblocked globally` },
  });

  revalidatePath("/creators");
  revalidatePath(`/creators/${creatorId}`);
  return { success: true };
}

export async function addCreatorToCampaign(creatorId: string, campaignId: string) {
  const user = await requireUser();

  const creator = await prisma.creator.findUniqueOrThrow({ where: { id: creatorId } });
  if (creator.globalEligibilityStatus === "unfit_globally_blocked") {
    throw new ForbiddenError("This creator is globally blocked and cannot be added to a campaign.");
  }

  const existing = await prisma.campaignCreator.findUnique({
    where: { campaignId_creatorId: { campaignId, creatorId } },
  });
  if (existing) {
    return { alreadyAdded: true };
  }

  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });

  const campaignCreator = await prisma.campaignCreator.create({
    data: {
      campaignId,
      creatorId,
      compensationType: campaign.defaultCompensationType ?? "gifting_only",
    },
  });

  await logActivity({
    entityType: "campaign_creator",
    entityId: campaignCreator.id,
    actorType: "user",
    actorId: user.id,
    actorName: user.name,
    action: "creator_sourced",
    detail: { message: `${creator.name} added to ${campaign.name}` },
  });

  // Synchronous, per architecture §"AI Creator Fit Scoring" — a scoring
  // failure is logged but never blocks the creator from being added.
  await scoreCreatorFitForCampaignCreator(campaignCreator.id);

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath(`/creators/${creatorId}`);
  return { alreadyAdded: false };
}

/**
 * On-demand only — never refresh every creator on a schedule (external API
 * cost). Called when a user views a profile or clicks Refresh.
 */
export async function refreshCreatorData(creatorId: string) {
  const user = await requireUser();
  const creator = await prisma.creator.findUniqueOrThrow({ where: { id: creatorId } });

  if (!creator.dataProviderName || !creator.dataProviderExternalId) {
    return { error: "This creator has no linked data provider to refresh from." };
  }

  const record = await creatorProvider.refreshCreator(creator.dataProviderExternalId);
  if (!record) {
    return { error: "Provider could not find this creator — it may no longer be available." };
  }

  await upsertCreatorFromProviderRecord(creator.dataProviderName, record);

  await logActivity({
    entityType: "creator",
    entityId: creatorId,
    actorType: "user",
    actorId: user.id,
    actorName: user.name,
    action: "creator_data_refreshed",
    detail: { message: `${creator.name}'s data refreshed from ${creator.dataProviderName}` },
  });

  revalidatePath(`/creators/${creatorId}`);
  return { success: true };
}
