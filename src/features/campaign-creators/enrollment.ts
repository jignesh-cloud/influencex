import crypto from "node:crypto";
import { prisma } from "@/db/prisma";
import { getAffiliateProvider } from "@/services/affiliate";
import type { EnrollmentStatus } from "@/services/affiliate";
import { callExternalService } from "@/lib/external-service";
import { logActivity } from "@/services/activity-log/log-activity";
import type { WorkflowStatus } from "@/generated/prisma/enums";

function generateOnboardingToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

/**
 * AffiliateEnrollment.enrollmentStatus and CampaignCreator.workflowStatus
 * are deliberately separate fields (one is network-facing, one is the
 * business pipeline stage) but must stay mirrored. This is the only mapping
 * between them — see architecture §"Enrollment Flow".
 */
const WORKFLOW_STATUS_FOR_ENROLLMENT: Partial<Record<EnrollmentStatus, WorkflowStatus>> = {
  invite_created: "invite_created",
  invited: "invite_sent",
  applied: "affiliate_application_pending",
  enrolled: "enrolled_active",
  // "inactive" has no workflow equivalent — workflowStatus stays wherever it
  // last was; the enrollment sub-status alone reflects that the network
  // deactivated the creator.
};

export async function startEnrollment(campaignCreatorId: string, affiliateProgramId: string) {
  const row = await prisma.campaignCreator.findUniqueOrThrow({
    where: { id: campaignCreatorId },
    include: { creator: true, campaign: true },
  });

  if (row.campaignDecision !== "accept_for_campaign") {
    throw new Error("Only creators accepted for this campaign can start affiliate enrollment.");
  }

  const program = await prisma.affiliateProgram.findUniqueOrThrow({ where: { id: affiliateProgramId } });
  const provider = getAffiliateProvider(program.network);

  const context = {
    networkProgramId: program.externalProgramId,
    externalEnrollmentRef: null,
    creatorName: row.creator.name,
    creatorEmail: row.creator.email,
    currentStatus: "invite_created" as const,
  };

  const invite = await callExternalService(`affiliate.${program.network}.createInviteLink`, () =>
    provider.createInviteLink(context),
  );

  const enrollment = await prisma.affiliateEnrollment.create({
    data: {
      campaignCreatorId,
      network: program.network,
      networkProgramId: program.externalProgramId,
      externalEnrollmentRef: invite.externalEnrollmentRef,
      inviteLink: invite.inviteLink,
      enrollmentStatus: "invite_created",
      onboardingToken: generateOnboardingToken(),
    },
  });

  await prisma.campaignCreator.update({
    where: { id: campaignCreatorId },
    data: { workflowStatus: "invite_created" },
  });

  await logActivity({
    entityType: "campaign_creator",
    entityId: campaignCreatorId,
    actorType: "system",
    action: "affiliate_enrollment_started",
    detail: { message: `Affiliate enrollment started for ${row.creator.name} via ${program.network}` },
  });

  return enrollment;
}

export async function syncEnrollmentStatus(enrollmentId: string) {
  const enrollment = await prisma.affiliateEnrollment.findUniqueOrThrow({
    where: { id: enrollmentId },
    include: { campaignCreator: { include: { creator: true } } },
  });

  const provider = getAffiliateProvider(enrollment.network);
  const context = {
    networkProgramId: enrollment.networkProgramId,
    externalEnrollmentRef: enrollment.externalEnrollmentRef,
    creatorName: enrollment.campaignCreator.creator.name,
    creatorEmail: enrollment.campaignCreator.creator.email,
    currentStatus: enrollment.enrollmentStatus as EnrollmentStatus,
  };

  const nextStatus = await callExternalService(`affiliate.${enrollment.network}.getEnrollmentStatus`, () =>
    provider.getEnrollmentStatus(context),
  );

  const nextContext = { ...context, currentStatus: nextStatus };
  const [trackingLink, performance] = await Promise.all([
    callExternalService(`affiliate.${enrollment.network}.getTrackingLink`, () => provider.getTrackingLink(nextContext)),
    callExternalService(`affiliate.${enrollment.network}.getPerformance`, () => provider.getPerformance(nextContext)),
  ]);

  await prisma.affiliateEnrollment.update({
    where: { id: enrollmentId },
    data: {
      enrollmentStatus: nextStatus,
      trackingLink: trackingLink ?? enrollment.trackingLink,
      payoutStatus: performance.payoutStatus ?? enrollment.payoutStatus,
      appliedAt: nextStatus === "applied" && !enrollment.appliedAt ? new Date() : enrollment.appliedAt,
      enrolledAt: nextStatus === "enrolled" && !enrollment.enrolledAt ? new Date() : enrollment.enrolledAt,
      lastSyncedAt: new Date(),
    },
  });

  const workflowStatus = WORKFLOW_STATUS_FOR_ENROLLMENT[nextStatus];
  await prisma.campaignCreator.update({
    where: { id: enrollment.campaignCreatorId },
    data: {
      ...(workflowStatus ? { workflowStatus } : {}),
      conversionRate: performance.conversionRate ?? undefined,
      gmv: performance.gmv ?? undefined,
    },
  });

  await logActivity({
    entityType: "campaign_creator",
    entityId: enrollment.campaignCreatorId,
    actorType: "system",
    action: "affiliate_enrollment_synced",
    detail: {
      message: `${enrollment.campaignCreator.creator.name}'s affiliate enrollment synced: ${nextStatus}`,
      status: nextStatus,
    },
  });

  return { status: nextStatus, trackingLink, performance };
}
