import { prisma } from "@/db/prisma";
import { hubSpotService } from "@/services/hubspot";
import { logActivity } from "@/services/activity-log/log-activity";

/**
 * Sourcing outreach pitch — sent when a creator is added to a campaign,
 * before any decision. Separate email from the affiliate invite (see
 * invite.ts), which only ever happens after acceptance + enrollment start.
 */
export async function sendCampaignPitch(campaignCreatorId: string, pitchMessage: string | undefined, manualEmail?: string) {
  const row = await prisma.campaignCreator.findUniqueOrThrow({
    where: { id: campaignCreatorId },
    include: { creator: true, campaign: { select: { name: true } } },
  });

  const email = row.creator.email ?? manualEmail;
  if (!email) {
    return { error: "Creator email required before sending a pitch." as const };
  }

  if (!row.creator.email && manualEmail) {
    await prisma.creator.update({ where: { id: row.creator.id }, data: { email: manualEmail } });
  }

  const contact = await hubSpotService.upsertContact({ email, firstName: row.creator.name.split(" ")[0] });
  const result = await hubSpotService.sendPitchEmail({
    hubspotContactId: contact.hubspotContactId,
    toEmail: email,
    creatorName: row.creator.name,
    campaignName: row.campaign.name,
    pitchMessage: pitchMessage || undefined,
  });

  await prisma.campaignCreator.update({
    where: { id: campaignCreatorId },
    data: {
      pitchMessage: pitchMessage || null,
      pitchEmailSentAt: new Date(),
      pitchEmailStatus: result.status,
    },
  });

  await logActivity({
    entityType: "campaign_creator",
    entityId: campaignCreatorId,
    actorType: "system",
    action: "pitch_email_sent",
    detail: {
      message:
        result.status === "sent"
          ? `${pitchMessage ? "Custom" : "Generic"} pitch email sent to ${row.creator.name}`
          : `Pitch email failed for ${row.creator.name}`,
      status: result.status,
    },
  });

  return { success: result.status === "sent", status: result.status };
}
