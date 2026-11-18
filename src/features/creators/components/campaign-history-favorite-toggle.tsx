"use client";

import { Star } from "lucide-react";
import { useTransition } from "react";
import { toggleFavorite } from "@/features/campaign-creators/actions";

export function CampaignHistoryFavoriteToggle({
  campaignCreatorId,
  favorite,
}: {
  campaignCreatorId: string;
  favorite: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      aria-label={favorite ? "Unfavorite" : "Favorite"}
      onClick={() => startTransition(() => toggleFavorite(campaignCreatorId, !favorite))}
      className="text-neutral-300 hover:text-brand"
    >
      <Star className={favorite ? "fill-brand text-brand" : ""} size={16} />
    </button>
  );
}
