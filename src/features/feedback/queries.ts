import { prisma } from "@/db/prisma";
import { isVisibleOnPublicFeedbackLink } from "@/features/campaigns/workflow";

export type FeedbackLinkPageState =
  | { status: "not_found" }
  | { status: "revoked" }
  | { status: "expired" }
  | { status: "active"; campaignId: string; campaignName: string; showPricing: boolean; token: string };

export async function getFeedbackLinkState(token: string): Promise<FeedbackLinkPageState> {
  const link = await prisma.clientFeedbackLink.findUnique({
    where: { token },
    include: { campaign: { select: { id: true, name: true, clientFeedbackDisplaySettings: true } } },
  });

  if (!link) return { status: "not_found" };
  if (link.revokedAt) return { status: "revoked" };
  if (link.expiresAt.getTime() < Date.now()) return { status: "expired" };

  const settings = link.campaign.clientFeedbackDisplaySettings as { showPricing?: boolean } | null;

  return {
    status: "active",
    campaignId: link.campaign.id,
    campaignName: link.campaign.name,
    showPricing: settings?.showPricing === true,
    token,
  };
}

export interface PublicShortlistCreator {
  campaignCreatorId: string;
  creatorId: string;
  name: string;
  handle: string | null;
  followers: number | null;
  engagementRate: number | null;
  exampleContentCount: number;
  compensationType: string;
  flatFeeAmount: number | null;
}

export async function getPublicShortlist(campaignId: string): Promise<PublicShortlistCreator[]> {
  const rows = await prisma.campaignCreator.findMany({
    where: { campaignId },
    include: { creator: true },
    orderBy: { createdAt: "asc" },
  });

  return rows
    .filter((row) => isVisibleOnPublicFeedbackLink(row.workflowStatus))
    .map((row) => {
      const c = row.creator;
      const exampleContent = Array.isArray(c.exampleContent) ? c.exampleContent : [];
      return {
        campaignCreatorId: row.id,
        creatorId: c.id,
        name: c.name,
        handle: c.instagramHandle ?? c.tiktokHandle ?? c.youtubeHandle,
        followers: c.instagramFollowers ?? c.tiktokFollowers ?? c.youtubeFollowers,
        engagementRate:
          c.instagramFollowers !== null
            ? c.instagramEngagementRate
            : c.tiktokFollowers !== null
              ? c.tiktokEngagementRate
              : c.youtubeEngagementRate,
        exampleContentCount: exampleContent.length,
        compensationType: row.compensationType,
        flatFeeAmount: row.flatFeeAmount ? Number(row.flatFeeAmount) : null,
      };
    });
}

export async function getFeedbackLinksForCampaign(campaignId: string) {
  const links = await prisma.clientFeedbackLink.findMany({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } },
  });

  const now = Date.now();
  const activeLink = links.find((link) => !link.revokedAt && link.expiresAt.getTime() > now) ?? null;

  return { links, activeLink };
}
