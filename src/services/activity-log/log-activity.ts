import { prisma } from "@/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { ActivityActorType } from "@/generated/prisma/enums";

export interface LogActivityInput {
  entityType: string;
  entityId: string;
  actorType: ActivityActorType;
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  detail?: Prisma.InputJsonValue;
}

/**
 * Single write path for ActivityLog. Every workflow/decision/block/override
 * mutation should call this rather than writing to the table directly.
 */
export async function logActivity(input: LogActivityInput) {
  await prisma.activityLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
      action: input.action,
      detail: input.detail ?? {},
    },
  });
}

export async function getRecentActivity(limit = 10) {
  return prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export interface ActivityLogFilters {
  entityType?: string;
  search?: string;
  limit?: number;
}

export async function getActivityLog(filters: ActivityLogFilters = {}) {
  return prisma.activityLog.findMany({
    where: {
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.search
        ? { OR: [{ action: { contains: filters.search, mode: "insensitive" } }, { actorName: { contains: filters.search, mode: "insensitive" } }] }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: filters.limit ?? 100,
  });
}

export async function getDistinctEntityTypes() {
  const rows = await prisma.activityLog.findMany({ distinct: ["entityType"], select: { entityType: true } });
  return rows.map((r) => r.entityType).sort();
}
