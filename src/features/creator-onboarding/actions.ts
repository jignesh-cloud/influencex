"use server";

import { prisma } from "@/db/prisma";
import { logActivity } from "@/services/activity-log/log-activity";

/** Public, token-based — no auth. Called once when the creator first views the page. */
export async function markOnboardingViewed(token: string) {
  const enrollment = await prisma.affiliateEnrollment.findUnique({ where: { onboardingToken: token } });
  if (!enrollment || enrollment.onboardingViewedAt) return;

  await prisma.affiliateEnrollment.update({
    where: { id: enrollment.id },
    data: { onboardingViewedAt: new Date() },
  });
}

/** Public, token-based — no auth. Called when the creator clicks "continue to signup". */
export async function confirmOnboarding(token: string) {
  const enrollment = await prisma.affiliateEnrollment.findUnique({
    where: { onboardingToken: token },
    include: { campaignCreator: { include: { creator: { select: { name: true } } } } },
  });
  if (!enrollment) {
    return { error: "This onboarding link is no longer valid." };
  }

  if (!enrollment.onboardingConfirmedAt) {
    await prisma.affiliateEnrollment.update({
      where: { id: enrollment.id },
      data: { onboardingConfirmedAt: new Date() },
    });

    await logActivity({
      entityType: "campaign_creator",
      entityId: enrollment.campaignCreatorId,
      actorType: "external_reviewer",
      actorName: enrollment.campaignCreator.creator.name,
      action: "creator_onboarding_confirmed",
      detail: { message: `${enrollment.campaignCreator.creator.name} confirmed onboarding and continued to signup` },
    });
  }

  return { success: true, inviteLink: enrollment.inviteLink };
}
