import { prisma } from "@/db/prisma";
import { env } from "@/lib/env";

export async function getAffiliatePrograms() {
  const programs = await prisma.affiliateProgram.findMany({
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return programs.map((p) => ({ ...p, hasCredential: p.credentials !== null }));
}

export function getIntegrationModes() {
  return [
    { name: "AI Fit Scoring", mode: env.AI_PROVIDER },
    { name: "Creator Data Provider", mode: env.CREATOR_PROVIDER },
    { name: "Impact", mode: env.AFFILIATE_IMPACT_MODE },
    { name: "Awin", mode: env.AFFILIATE_AWIN_MODE },
    { name: "AvantLink", mode: env.AFFILIATE_AVANTLINK_MODE },
    { name: "HubSpot", mode: env.HUBSPOT_MODE },
  ];
}
