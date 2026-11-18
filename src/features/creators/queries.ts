import { prisma } from "@/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface CreatorDirectoryFilters {
  search?: string;
  platform?: "instagram" | "tiktok" | "youtube";
  vertical?: string;
  clientId?: string;
  showBlocked?: boolean;
}

export interface CreatorDirectoryItem {
  id: string;
  name: string;
  instagramHandle: string | null;
  verticalTags: string;
  engagementRate: number | null;
  bestConversionRate: number | null;
  globalEligibilityStatus: string;
  globalBlockReason: string | null;
  blockedByName: string | null;
  blockedAt: Date | null;
}

export async function getCreatorsDirectory(filters: CreatorDirectoryFilters): Promise<CreatorDirectoryItem[]> {
  const where: Prisma.CreatorWhereInput = {
    // Content safety: excluded by default, never just a warning (see architecture §"Content Safety").
    OR: [{ contentFlagged: false }, { contentFlagOverride: true }],
  };

  const and: Prisma.CreatorWhereInput[] = [];

  if (!filters.showBlocked) {
    and.push({ globalEligibilityStatus: "eligible_for_future_campaigns" });
  }
  if (filters.search) {
    and.push({
      OR: [
        { name: { contains: filters.search, mode: "insensitive" } },
        { instagramHandle: { contains: filters.search, mode: "insensitive" } },
        { tiktokHandle: { contains: filters.search, mode: "insensitive" } },
        { youtubeHandle: { contains: filters.search, mode: "insensitive" } },
      ],
    });
  }
  if (filters.platform === "instagram") and.push({ instagramFollowers: { not: null } });
  if (filters.platform === "tiktok") and.push({ tiktokFollowers: { not: null } });
  if (filters.platform === "youtube") and.push({ youtubeFollowers: { not: null } });
  if (filters.vertical) and.push({ verticalTags: { array_contains: [filters.vertical] } });
  if (filters.clientId) {
    and.push({ campaignCreators: { some: { campaign: { clientId: filters.clientId } } } });
  }

  const creators = await prisma.creator.findMany({
    where: and.length > 0 ? { AND: [where, ...and] } : where,
    include: {
      blockedBy: { select: { name: true } },
      campaignCreators: { select: { conversionRate: true } },
    },
    orderBy: { name: "asc" },
  });

  return creators.map((c) => {
    const engagementRate =
      c.instagramFollowers !== null
        ? c.instagramEngagementRate
        : c.tiktokFollowers !== null
          ? c.tiktokEngagementRate
          : c.youtubeFollowers !== null
            ? c.youtubeEngagementRate
            : null;

    const conversionRates = c.campaignCreators.map((cc) => cc.conversionRate).filter((v): v is number => v !== null);
    const bestConversionRate = conversionRates.length > 0 ? Math.max(...conversionRates) : null;

    return {
      id: c.id,
      name: c.name,
      instagramHandle: c.instagramHandle,
      verticalTags: Array.isArray(c.verticalTags) ? (c.verticalTags as string[]).join(", ") : "",
      engagementRate,
      bestConversionRate,
      globalEligibilityStatus: c.globalEligibilityStatus,
      globalBlockReason: c.globalBlockReason,
      blockedByName: c.blockedBy?.name ?? null,
      blockedAt: c.blockedAt,
    };
  });
}

export async function getCreatorProfile(creatorId: string) {
  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    include: {
      blockedBy: { select: { name: true } },
      unblockedBy: { select: { name: true } },
    },
  });

  if (!creator) return null;

  const campaignHistory = await prisma.campaignCreator.findMany({
    where: { creatorId },
    orderBy: { createdAt: "desc" },
    include: {
      campaign: { select: { id: true, name: true, client: { select: { id: true, name: true } } } },
      clientPreferences: true,
    },
  });

  return { creator, campaignHistory };
}

export async function getCampaignOptionsForCreator(creatorId: string) {
  const [campaigns, existing] = await Promise.all([
    prisma.campaign.findMany({
      where: { status: { not: "completed" } },
      select: { id: true, name: true, client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.campaignCreator.findMany({ where: { creatorId }, select: { campaignId: true } }),
  ]);
  const existingIds = new Set(existing.map((e) => e.campaignId));
  return campaigns.map((c) => ({ ...c, alreadyAdded: existingIds.has(c.id) }));
}
