import { prisma } from "@/db/prisma";

const REVIEW_PENDING_STATUSES = ["pending_internal_review", "group8a_review"] as const;

export async function getClientsWithStats() {
  const clients = await prisma.client.findMany({
    include: {
      campaigns: {
        select: {
          id: true,
          status: true,
          campaignCreators: { select: { workflowStatus: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return clients.map((client) => {
    const activeCampaignCount = client.campaigns.filter((c) => c.status === "active").length;
    const pendingReviewCount = client.campaigns.reduce(
      (sum, campaign) =>
        sum +
        campaign.campaignCreators.filter((cc) =>
          REVIEW_PENDING_STATUSES.includes(cc.workflowStatus as (typeof REVIEW_PENDING_STATUSES)[number]),
        ).length,
      0,
    );

    return {
      id: client.id,
      name: client.name,
      contactName: client.contactName,
      contactEmail: client.contactEmail,
      campaignCount: client.campaigns.length,
      activeCampaignCount,
      pendingReviewCount,
    };
  });
}

export async function getClientById(clientId: string) {
  return prisma.client.findUnique({
    where: { id: clientId },
    include: {
      affiliatePrograms: { orderBy: { network: "asc" } },
      campaigns: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { campaignCreators: true } },
        },
      },
    },
  });
}
