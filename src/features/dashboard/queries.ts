import { prisma } from "@/db/prisma";

export async function getDashboardStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    activeCampaigns,
    creatorsSourcedThisMonth,
    pendingInternalReview,
    awaitingClientFeedback,
    affiliateEnrollmentsPending,
    affiliateEnrollmentsActive,
  ] = await Promise.all([
    prisma.campaign.count({ where: { status: "active" } }),
    prisma.campaignCreator.count({ where: { sourcedAt: { gte: startOfMonth } } }),
    prisma.campaignCreator.count({ where: { workflowStatus: "pending_internal_review" } }),
    prisma.campaignCreator.count({ where: { workflowStatus: "sent_to_client" } }),
    prisma.affiliateEnrollment.count({
      where: { enrollmentStatus: { in: ["invite_created", "invited", "applied"] } },
    }),
    prisma.affiliateEnrollment.count({ where: { enrollmentStatus: "enrolled" } }),
  ]);

  return {
    activeCampaigns,
    creatorsSourcedThisMonth,
    pendingInternalReview,
    awaitingClientFeedback,
    affiliateEnrollmentsPending,
    affiliateEnrollmentsActive,
  };
}
