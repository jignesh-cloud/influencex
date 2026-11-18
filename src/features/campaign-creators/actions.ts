"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/services/activity-log/log-activity";
import { resolveWorkflowStatusForDecision, PRE_DECISION_STATUSES } from "@/features/campaigns/workflow";
import { scoreCreatorFitForCampaignCreator } from "@/features/campaign-creators/fit-scoring";
import { startEnrollment, syncEnrollmentStatus } from "@/features/campaign-creators/enrollment";
import { sendAffiliateInvite } from "@/features/campaign-creators/invite";
import { sendCampaignPitch } from "@/features/campaign-creators/pitch";
import type { AIFitTier, CampaignDecision, ContentStatus, WorkflowStatus } from "@/generated/prisma/enums";

const DECISION_LABELS: Record<CampaignDecision, string> = {
  accept_for_campaign: "Accept for This Campaign",
  decline_for_campaign: "Decline for This Campaign",
  keep_pending: "Keep Pending",
};

async function getRowForMutation(campaignCreatorId: string) {
  const row = await prisma.campaignCreator.findUniqueOrThrow({
    where: { id: campaignCreatorId },
    include: { creator: { select: { name: true } }, campaign: { select: { id: true } } },
  });
  return row;
}

export async function setCampaignDecision(campaignCreatorId: string, decision: CampaignDecision) {
  const user = await requireUser();
  const row = await getRowForMutation(campaignCreatorId);

  const newStatus = resolveWorkflowStatusForDecision(decision, row.compensationType);

  await prisma.campaignCreator.update({
    where: { id: campaignCreatorId },
    data: {
      campaignDecision: decision,
      workflowStatus: newStatus,
      decidedAt: decision === "keep_pending" ? null : new Date(),
    },
  });

  await logActivity({
    entityType: "campaign_creator",
    entityId: campaignCreatorId,
    actorType: "user",
    actorId: user.id,
    actorName: user.name,
    action: "campaign_decision_changed",
    detail: {
      message: `${DECISION_LABELS[decision]}: ${row.creator.name}`,
      from: row.campaignDecision,
      to: decision,
      workflowStatusFrom: row.workflowStatus,
      workflowStatusTo: newStatus,
    },
  });

  revalidatePath(`/campaigns/${row.campaign.id}`);
}

export async function setWorkflowStatus(campaignCreatorId: string, status: WorkflowStatus) {
  const user = await requireUser();
  if (!PRE_DECISION_STATUSES.includes(status)) {
    throw new Error(`"${status}" cannot be set manually — it is derived from a campaign decision.`);
  }

  const row = await getRowForMutation(campaignCreatorId);

  await prisma.campaignCreator.update({
    where: { id: campaignCreatorId },
    data: { workflowStatus: status },
  });

  await logActivity({
    entityType: "campaign_creator",
    entityId: campaignCreatorId,
    actorType: "user",
    actorId: user.id,
    actorName: user.name,
    action: "workflow_status_changed",
    detail: { from: row.workflowStatus, to: status, creatorName: row.creator.name },
  });

  revalidatePath(`/campaigns/${row.campaign.id}`);
}

export async function toggleFavorite(campaignCreatorId: string, favorite: boolean) {
  await requireUser();
  const row = await prisma.campaignCreator.update({
    where: { id: campaignCreatorId },
    data: { favorite },
    select: { campaignId: true },
  });
  revalidatePath(`/campaigns/${row.campaignId}`);
}

export async function updateTeamNotes(campaignCreatorId: string, teamNotes: string) {
  const user = await requireUser();
  const row = await prisma.campaignCreator.update({
    where: { id: campaignCreatorId },
    data: { teamNotes: teamNotes || null },
    select: { campaignId: true, creator: { select: { name: true } } },
  });

  await logActivity({
    entityType: "campaign_creator",
    entityId: campaignCreatorId,
    actorType: "user",
    actorId: user.id,
    actorName: user.name,
    action: "team_notes_updated",
    detail: { creatorName: row.creator.name },
  });

  revalidatePath(`/campaigns/${row.campaignId}`);
}

export async function rescoreCreatorFit(campaignCreatorId: string) {
  await requireUser();
  const row = await getRowForMutation(campaignCreatorId);
  const outcome = await scoreCreatorFitForCampaignCreator(campaignCreatorId);
  revalidatePath(`/campaigns/${row.campaign.id}`);
  return outcome;
}

export async function overrideAiFit(campaignCreatorId: string, tier: AIFitTier, explanation: string) {
  const user = await requireUser();
  const row = await getRowForMutation(campaignCreatorId);

  await prisma.campaignCreator.update({
    where: { id: campaignCreatorId },
    data: { aiFitScore: tier, aiFitExplanation: explanation || null },
  });

  await logActivity({
    entityType: "campaign_creator",
    entityId: campaignCreatorId,
    actorType: "user",
    actorId: user.id,
    actorName: user.name,
    action: "ai_fit_manually_overridden",
    detail: { message: `${row.creator.name}'s AI fit manually set to ${tier}`, tier },
  });

  revalidatePath(`/campaigns/${row.campaign.id}`);
  return { success: true };
}

export async function startCreatorEnrollment(campaignCreatorId: string, affiliateProgramId: string) {
  const user = await requireUser();
  const row = await getRowForMutation(campaignCreatorId);

  try {
    await startEnrollment(campaignCreatorId, affiliateProgramId);
  } catch (error) {
    console.error(`[startCreatorEnrollment] failed for ${campaignCreatorId}:`, error);
    return { error: error instanceof Error ? error.message : "Failed to start enrollment." };
  }

  void user;
  revalidatePath(`/campaigns/${row.campaign.id}`);
  return { success: true };
}

export async function syncCreatorEnrollment(enrollmentId: string, campaignId: string) {
  await requireUser();

  try {
    const outcome = await syncEnrollmentStatus(enrollmentId);
    revalidatePath(`/campaigns/${campaignId}`);
    return { success: true as const, outcome };
  } catch (error) {
    console.error(`[syncCreatorEnrollment] failed for ${enrollmentId}:`, error);
    return { success: false as const, error: "Failed to sync enrollment status. Try again shortly." };
  }
}

export async function sendCreatorAffiliateInvite(enrollmentId: string, campaignId: string, manualEmail?: string) {
  await requireUser();

  try {
    const result = await sendAffiliateInvite(enrollmentId, manualEmail);
    revalidatePath(`/campaigns/${campaignId}`);
    return result;
  } catch (error) {
    console.error(`[sendCreatorAffiliateInvite] failed for ${enrollmentId}:`, error);
    return { error: "Failed to send the affiliate invite email. Try again shortly." };
  }
}

export async function setContentStatus(campaignCreatorId: string, status: ContentStatus) {
  const user = await requireUser();
  const row = await getRowForMutation(campaignCreatorId);

  await prisma.campaignCreator.update({ where: { id: campaignCreatorId }, data: { contentStatus: status } });

  await logActivity({
    entityType: "campaign_creator",
    entityId: campaignCreatorId,
    actorType: "user",
    actorId: user.id,
    actorName: user.name,
    action: "content_status_changed",
    detail: { message: `${row.creator.name}'s content marked ${status.replaceAll("_", " ")}`, status },
  });

  revalidatePath(`/campaigns/${row.campaign.id}`);
}

export async function sendCreatorPitch(campaignCreatorId: string, pitchMessage: string | undefined, manualEmail?: string) {
  await requireUser();
  const row = await getRowForMutation(campaignCreatorId);

  try {
    const result = await sendCampaignPitch(campaignCreatorId, pitchMessage, manualEmail);
    revalidatePath(`/campaigns/${row.campaign.id}`);
    return result;
  } catch (error) {
    console.error(`[sendCreatorPitch] failed for ${campaignCreatorId}:`, error);
    return { error: "Failed to send the pitch email. Try again shortly." };
  }
}
