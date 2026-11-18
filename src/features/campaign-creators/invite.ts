import crypto from "node:crypto";
import { prisma } from "@/db/prisma";
import { env } from "@/lib/env";
import { hubSpotService } from "@/services/hubspot";
import { logActivity } from "@/services/activity-log/log-activity";

function getBaseUrl(): string {
  return env.FEEDBACK_LINK_BASE_URL ?? env.NEXTAUTH_URL ?? "http://localhost:3000";
}

/**
 * "Invited" (AffiliateEnrollment/workflowStatus) is something *we* cause by
 * sending the HubSpot invite — unlike applied/enrolled, which the affiliate
 * network reports back to us (see enrollment.ts's syncEnrollmentStatus).
 */
export async function sendAffiliateInvite(enrollmentId: string, manualEmail?: string) {
  const enrollment = await prisma.affiliateEnrollment.findUniqueOrThrow({
    where: { id: enrollmentId },
    include: { campaignCreator: { include: { creator: true } } },
  });

  const creator = enrollment.campaignCreator.creator;
  const email = creator.email ?? manualEmail;

  if (!email) {
    return { error: "Creator email required before sending invitation." as const };
  }

  if (!creator.email && manualEmail) {
    await prisma.creator.update({ where: { id: creator.id }, data: { email: manualEmail } });
  }

  // Every enrollment gets an onboarding token at creation; back-fill defensively
  // in case this row predates that field.
  const onboardingToken = enrollment.onboardingToken ?? crypto.randomBytes(24).toString("hex");
  if (!enrollment.onboardingToken) {
    await prisma.affiliateEnrollment.update({ where: { id: enrollmentId }, data: { onboardingToken } });
  }
  const onboardingUrl = `${getBaseUrl()}/join/${onboardingToken}`;

  const contact = await hubSpotService.upsertContact({ email, firstName: creator.name.split(" ")[0] });
  const result = await hubSpotService.sendAffiliateInviteEmail({
    hubspotContactId: contact.hubspotContactId,
    toEmail: email,
    onboardingUrl,
  });

  await prisma.affiliateEnrollment.update({
    where: { id: enrollmentId },
    data: {
      hubspotContactId: contact.hubspotContactId,
      inviteEmailSentAt: new Date(),
      inviteEmailStatus: result.status,
      ...(result.status === "sent" ? { enrollmentStatus: "invited" } : {}),
    },
  });

  if (result.status === "sent") {
    await prisma.campaignCreator.update({
      where: { id: enrollment.campaignCreatorId },
      data: { workflowStatus: "invite_sent" },
    });
  }

  await logActivity({
    entityType: "campaign_creator",
    entityId: enrollment.campaignCreatorId,
    actorType: "system",
    action: "affiliate_invite_email_sent",
    detail: {
      message:
        result.status === "sent"
          ? `Affiliate invite email sent to ${creator.name}`
          : `Affiliate invite email failed for ${creator.name}`,
      status: result.status,
    },
  });

  return { success: result.status === "sent", status: result.status };
}
