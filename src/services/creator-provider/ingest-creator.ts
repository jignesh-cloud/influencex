import { prisma } from "@/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { CreatorProviderRecord } from "@/services/creator-provider/types";

function normalizeHandle(handle: string | null | undefined): string | null {
  if (!handle) return null;
  return handle.trim().replace(/^@/, "").toLowerCase();
}

/**
 * Deduplicate by provider ID first, then by platform+handle. Never creates a
 * second Creator row for a person already on file — updates and reuses the
 * existing record instead (see architecture §"Duplicate Creator Handling").
 */
export async function upsertCreatorFromProviderRecord(providerName: string, record: CreatorProviderRecord) {
  const instagramHandle = normalizeHandle(record.instagramHandle);
  const tiktokHandle = normalizeHandle(record.tiktokHandle);
  const youtubeHandle = normalizeHandle(record.youtubeHandle);

  let existing = await prisma.creator.findFirst({
    where: { dataProviderName: providerName, dataProviderExternalId: record.externalId },
  });

  if (!existing) {
    const handleConditions: Prisma.CreatorWhereInput[] = [];
    if (instagramHandle) handleConditions.push({ instagramHandle });
    if (tiktokHandle) handleConditions.push({ tiktokHandle });
    if (youtubeHandle) handleConditions.push({ youtubeHandle });

    if (handleConditions.length > 0) {
      existing = await prisma.creator.findFirst({ where: { OR: handleConditions } });
    }
  }

  const data: Prisma.CreatorUncheckedCreateInput = {
    name: record.name,
    email: record.email ?? null,
    instagramHandle,
    tiktokHandle,
    youtubeHandle,
    instagramFollowers: record.instagramFollowers ?? null,
    tiktokFollowers: record.tiktokFollowers ?? null,
    youtubeFollowers: record.youtubeFollowers ?? null,
    instagramEngagementRate: record.instagramEngagementRate ?? null,
    tiktokEngagementRate: record.tiktokEngagementRate ?? null,
    youtubeEngagementRate: record.youtubeEngagementRate ?? null,
    averageLikes: record.averageLikes ?? null,
    averageViews: record.averageViews ?? null,
    credibilityScore: record.credibilityScore ?? null,
    location: record.location ?? null,
    age: record.age ?? null,
    gender: record.gender ?? null,
    interests: record.interests ?? [],
    brandAffinities: record.brandAffinities ?? [],
    audienceDemographics: (record.audienceDemographics ?? {}) as Prisma.InputJsonValue,
    exampleContent: (record.exampleContent ?? []) as Prisma.InputJsonValue,
    verticalTags: record.verticalTags ?? [],
    contentFlagged: record.contentFlagged ?? false,
    dataProviderName: providerName,
    dataProviderExternalId: record.externalId,
    dataLastRefreshedAt: new Date(),
  };

  if (existing) {
    return prisma.creator.update({ where: { id: existing.id }, data });
  }

  return prisma.creator.create({ data });
}
