"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatFollowers, formatPercent } from "@/features/campaign-creators/table/format";
import { addSearchResultToCampaign } from "@/features/creator-search/actions";
import type { CreatorSearchResult } from "@/services/creator-provider/types";

function primaryStats(result: CreatorSearchResult) {
  if (result.instagramFollowers != null) {
    return { platform: "Instagram", handle: result.instagramHandle, followers: result.instagramFollowers, engagement: result.instagramEngagementRate };
  }
  if (result.tiktokFollowers != null) {
    return { platform: "TikTok", handle: result.tiktokHandle, followers: result.tiktokFollowers, engagement: result.tiktokEngagementRate };
  }
  return { platform: "YouTube", handle: result.youtubeHandle, followers: result.youtubeFollowers, engagement: result.youtubeEngagementRate };
}

function ResultCard({ result, campaignId }: { result: CreatorSearchResult; campaignId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const stats = primaryStats(result);

  function handleAdd() {
    startTransition(async () => {
      const outcome = await addSearchResultToCampaign(campaignId, result);
      setMessage(outcome.alreadyAdded ? "Already on this campaign." : "Added to campaign.");
    });
  }

  function handleFindSimilar() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("similarTo", result.externalId);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <Card className="space-y-2 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-neutral-900">{result.name}</p>
          <p className="text-xs text-neutral-500">
            {stats.platform} @{stats.handle} · {result.location ?? "—"}
          </p>
        </div>
        {result.credibilityScore != null ? (
          <Badge variant="outline">Credibility {result.credibilityScore}</Badge>
        ) : null}
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span>{formatFollowers(stats.followers ?? null)} followers</span>
        <span>{formatPercent(stats.engagement ?? null)} engagement</span>
      </div>
      {result.verticalTags && result.verticalTags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {result.verticalTags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" disabled={isPending} onClick={handleAdd}>
          {isPending ? "Adding…" : "Add to Campaign"}
        </Button>
        <Button size="sm" variant="outline" onClick={handleFindSimilar}>
          Find Similar
        </Button>
        {message ? <span className="text-xs text-neutral-500">{message}</span> : null}
      </div>
    </Card>
  );
}

export function CreatorSearchResults({ results, campaignId }: { results: CreatorSearchResult[]; campaignId: string }) {
  if (results.length === 0) {
    return <p className="py-12 text-center text-sm text-neutral-500">No creators match these filters.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {results.map((result) => (
        <ResultCard key={result.externalId} result={result} campaignId={campaignId} />
      ))}
    </div>
  );
}
