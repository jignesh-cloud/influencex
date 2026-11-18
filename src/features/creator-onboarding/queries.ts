import { prisma } from "@/db/prisma";

export type OnboardingPageState =
  | { status: "not_found" }
  | {
      status: "active";
      creatorName: string;
      campaignName: string;
      clientName: string;
      product: string | null;
      deliverables: string | null;
      contentStyle: string | null;
      usageRightsExpectations: string | null;
      compensationType: string;
      flatFeeAmount: number | null;
      network: string;
      inviteLink: string | null;
      alreadyConfirmed: boolean;
    };

export async function getOnboardingPageState(token: string): Promise<OnboardingPageState> {
  const enrollment = await prisma.affiliateEnrollment.findUnique({
    where: { onboardingToken: token },
    include: {
      campaignCreator: {
        include: {
          creator: { select: { name: true } },
          campaign: { select: { name: true, product: true, deliverables: true, contentStyle: true, usageRightsExpectations: true, client: { select: { name: true } } } },
        },
      },
    },
  });

  if (!enrollment) return { status: "not_found" };

  const cc = enrollment.campaignCreator;

  return {
    status: "active",
    creatorName: cc.creator.name,
    campaignName: cc.campaign.name,
    clientName: cc.campaign.client.name,
    product: cc.campaign.product,
    deliverables: cc.campaign.deliverables,
    contentStyle: cc.campaign.contentStyle,
    usageRightsExpectations: cc.campaign.usageRightsExpectations,
    compensationType: cc.compensationType,
    flatFeeAmount: cc.flatFeeAmount ? Number(cc.flatFeeAmount) : null,
    network: enrollment.network,
    inviteLink: enrollment.inviteLink,
    alreadyConfirmed: enrollment.onboardingConfirmedAt !== null,
  };
}
