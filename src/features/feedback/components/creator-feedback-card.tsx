"use client";

import { useState, useTransition } from "react";
import { submitClientFeedback } from "@/features/feedback/actions";
import { formatFollowers, formatPercent, formatCurrency } from "@/features/campaign-creators/table/format";
import type { PublicShortlistCreator } from "@/features/feedback/queries";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

const COMPENSATION_LABELS: Record<string, string> = {
  gifting_only: "Gifting",
  commission_only: "Commission",
  flat_fee: "Flat fee",
  flat_fee_plus_commission: "Flat fee + commission",
};

export function CreatorFeedbackCard({
  token,
  creator,
  reviewerName,
  reviewerEmail,
  showPricing,
}: {
  token: string;
  creator: PublicShortlistCreator;
  reviewerName: string;
  reviewerEmail: string;
  showPricing: boolean;
}) {
  const [comment, setComment] = useState("");
  const [selected, setSelected] = useState<"interested" | "pass_for_campaign" | "negotiating" | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(preference: "interested" | "pass_for_campaign" | "negotiating") {
    if (!reviewerName.trim()) {
      setError("Enter your name above before submitting feedback.");
      return;
    }
    setError(null);
    setSelected(preference);
    startTransition(async () => {
      const result = await submitClientFeedback(token, creator.campaignCreatorId, {
        reviewerName,
        reviewerEmail,
        preference,
        comment,
      });
      if (result.error) {
        setError(result.error);
        setSaved(false);
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <Card className="space-y-3 p-5">
      <div>
        <p className="font-semibold text-neutral-900">{creator.name}</p>
        {creator.handle ? <p className="text-sm text-neutral-500">@{creator.handle}</p> : null}
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
        <span>{formatFollowers(creator.followers)} followers</span>
        <span>{formatPercent(creator.engagementRate)} engagement</span>
        <span>
          {creator.exampleContentCount > 0 ? `${creator.exampleContentCount} example content item(s)` : "No example content on file"}
        </span>
      </div>
      {showPricing ? (
        <p className="text-sm text-neutral-600">
          {COMPENSATION_LABELS[creator.compensationType] ?? creator.compensationType}
          {creator.flatFeeAmount ? ` · ${formatCurrency(creator.flatFeeAmount)}` : ""}
        </p>
      ) : null}

      <Textarea
        placeholder="Optional comment…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={selected === "interested" ? "default" : "outline"}
          disabled={isPending}
          onClick={() => submit("interested")}
        >
          Interested
        </Button>
        <Button
          variant={selected === "negotiating" ? "default" : "outline"}
          disabled={isPending}
          onClick={() => submit("negotiating")}
        >
          Negotiating
        </Button>
        <Button
          variant={selected === "pass_for_campaign" ? "default" : "outline"}
          disabled={isPending}
          onClick={() => submit("pass_for_campaign")}
        >
          Pass for This Campaign
        </Button>
        {saved && !error ? <span className="text-sm text-emerald-700">Feedback saved</span> : null}
        {error ? <span className="text-sm text-red-600">{error}</span> : null}
      </div>
    </Card>
  );
}
