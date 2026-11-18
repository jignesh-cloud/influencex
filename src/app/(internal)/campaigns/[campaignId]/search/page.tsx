import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/db/prisma";
import { creatorProvider } from "@/services/creator-provider";
import type { CreatorSearchInput, Platform } from "@/services/creator-provider/types";
import { CreatorSearchForm } from "@/features/creator-search/components/creator-search-form";
import { CreatorSearchResults } from "@/features/creator-search/components/creator-search-results";

function toNumber(value: unknown): number | undefined {
  const n = Number(value);
  return typeof value === "string" && value.length > 0 && !Number.isNaN(n) ? n : undefined;
}

export default async function CampaignCreatorSearchPage({
  params,
  searchParams,
}: PageProps<"/campaigns/[campaignId]/search">) {
  const { campaignId } = await params;
  const sp = await searchParams;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, name: true, client: { select: { name: true } } },
  });
  if (!campaign) {
    notFound();
  }

  const similarTo = typeof sp.similarTo === "string" ? sp.similarTo : undefined;

  const input: CreatorSearchInput = {
    keyword: typeof sp.keyword === "string" ? sp.keyword : undefined,
    vertical: typeof sp.vertical === "string" ? sp.vertical : undefined,
    platform:
      sp.platform === "instagram" || sp.platform === "tiktok" || sp.platform === "youtube"
        ? (sp.platform as Platform)
        : undefined,
    location: typeof sp.location === "string" ? sp.location : undefined,
    audienceLocation: typeof sp.audienceLocation === "string" ? sp.audienceLocation : undefined,
    followerMin: toNumber(sp.followerMin),
    followerMax: toNumber(sp.followerMax),
    engagementRateMin: toNumber(sp.engagementRateMin),
    ageMin: toNumber(sp.ageMin),
    ageMax: toNumber(sp.ageMax),
    gender: typeof sp.gender === "string" ? sp.gender : undefined,
  };

  const { results } = similarTo
    ? { results: await creatorProvider.findSimilarCreators(similarTo, input) }
    : await creatorProvider.searchCreators(input);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/campaigns/${campaign.id}`} className="text-sm text-neutral-500 hover:underline">
          {campaign.name}
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900">Find creators — {campaign.client.name}</h1>
      </div>

      <CreatorSearchForm />
      {similarTo ? <p className="text-sm text-neutral-500">Showing creators similar to the selected profile.</p> : null}
      <CreatorSearchResults results={results} campaignId={campaign.id} />
    </div>
  );
}
