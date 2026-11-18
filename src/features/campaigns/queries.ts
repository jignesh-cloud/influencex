import { prisma } from "@/db/prisma";
import type { CampaignCreatorRow } from "@/features/campaign-creators/types";

export async function getClientForCampaignBuilder(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      name: true,
      affiliatePrograms: { where: { active: true }, select: { id: true, network: true, programName: true } },
    },
  });
  const contentGuidelineTemplates = await prisma.contentGuidelineTemplate.findMany({
    where: { OR: [{ clientId }, { clientId: null }] },
    select: { id: true, name: true, clientId: true },
    orderBy: { name: "asc" },
  });
  return client ? { ...client, contentGuidelineTemplates } : null;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

export async function getCampaignForDashboard(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          affiliatePrograms: { where: { active: true }, select: { id: true, network: true, programName: true } },
        },
      },
      campaignCreators: {
        orderBy: { createdAt: "asc" },
        include: {
          creator: true,
          clientPreferences: { orderBy: { submittedAt: "asc" } },
          affiliateEnrollments: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  if (!campaign) return null;

  const creatorIds = campaign.campaignCreators.map((cc) => cc.creatorId);
  const lastCampaignByCreator = new Map<string, string>();

  if (creatorIds.length > 0) {
    const otherAppearances = await prisma.campaignCreator.findMany({
      where: { creatorId: { in: creatorIds }, campaignId: { not: campaignId } },
      orderBy: { createdAt: "desc" },
      select: { creatorId: true, campaign: { select: { name: true } } },
    });
    for (const appearance of otherAppearances) {
      if (!lastCampaignByCreator.has(appearance.creatorId)) {
        lastCampaignByCreator.set(appearance.creatorId, appearance.campaign.name);
      }
    }
  }

  const rows: CampaignCreatorRow[] = campaign.campaignCreators.map((cc) => {
    const c = cc.creator;
    const platforms = (
      [
        ["instagram", c.instagramFollowers],
        ["tiktok", c.tiktokFollowers],
        ["youtube", c.youtubeFollowers],
      ] as const
    )
      .filter(([, followers]) => followers !== null)
      .map(([platform]) => platform);

    const followers = c.instagramFollowers ?? c.tiktokFollowers ?? c.youtubeFollowers ?? null;
    const engagementRate =
      c.instagramFollowers !== null
        ? c.instagramEngagementRate
        : c.tiktokFollowers !== null
          ? c.tiktokEngagementRate
          : c.youtubeFollowers !== null
            ? c.youtubeEngagementRate
            : null;

    const exampleContent = Array.isArray(c.exampleContent) ? c.exampleContent : [];

    return {
      id: cc.id,
      creatorId: c.id,
      creatorName: c.name,
      creatorEmail: c.email,
      instagramHandle: c.instagramHandle,
      tiktokHandle: c.tiktokHandle,
      youtubeHandle: c.youtubeHandle,
      instagramFollowers: c.instagramFollowers,
      tiktokFollowers: c.tiktokFollowers,
      youtubeFollowers: c.youtubeFollowers,
      instagramEngagementRate: c.instagramEngagementRate,
      tiktokEngagementRate: c.tiktokEngagementRate,
      youtubeEngagementRate: c.youtubeEngagementRate,
      followers,
      engagementRate,
      platforms: platforms.join(", "),
      exampleContentCount: exampleContent.length,
      location: c.location,
      age: c.age,
      gender: c.gender,
      workflowStatus: cc.workflowStatus,
      campaignDecision: cc.campaignDecision,
      favorite: cc.favorite,
      declinedReason: cc.declinedReason,
      contentStatus: cc.contentStatus,
      pitchMessage: cc.pitchMessage,
      pitchEmailSentAt: cc.pitchEmailSentAt,
      pitchEmailStatus: cc.pitchEmailStatus,
      aiFitScore: cc.aiFitScore,
      aiFitExplanation: cc.aiFitExplanation,
      teamNotes: cc.teamNotes,
      compensationType: cc.compensationType,
      flatFeeAmount: toNumber(cc.flatFeeAmount),
      flatFeePaymentStatus: cc.flatFeePaymentStatus,
      usageRightsGranted: cc.usageRightsGranted,
      usageRightsDuration: cc.usageRightsDuration,
      usageRightsFee: toNumber(cc.usageRightsFee),
      exclusivity: cc.exclusivity,
      conversionRate: cc.conversionRate,
      gmv: toNumber(cc.gmv),
      lastCampaignName: lastCampaignByCreator.get(c.id) ?? null,
      product: campaign.product,
      deliverables: campaign.deliverables,
      clientPreferences: cc.clientPreferences.map((p) => ({
        reviewerName: p.reviewerName,
        reviewerEmail: p.reviewerEmail,
        preference: p.preference,
        comment: p.comment,
        submittedAt: p.submittedAt,
      })),
      latestEnrollment: cc.affiliateEnrollments[0]
        ? {
            id: cc.affiliateEnrollments[0].id,
            network: cc.affiliateEnrollments[0].network,
            enrollmentStatus: cc.affiliateEnrollments[0].enrollmentStatus,
            inviteLink: cc.affiliateEnrollments[0].inviteLink,
            trackingLink: cc.affiliateEnrollments[0].trackingLink,
            inviteEmailStatus: cc.affiliateEnrollments[0].inviteEmailStatus,
            inviteEmailSentAt: cc.affiliateEnrollments[0].inviteEmailSentAt,
          }
        : null,
    };
  });

  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    client: campaign.client,
    rows,
  };
}
