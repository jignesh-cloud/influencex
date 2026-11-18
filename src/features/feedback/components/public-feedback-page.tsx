"use client";

import { useState } from "react";
import { CreatorFeedbackCard } from "@/features/feedback/components/creator-feedback-card";
import type { PublicShortlistCreator } from "@/features/feedback/queries";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";

export function PublicFeedbackPage({
  token,
  campaignName,
  showPricing,
  creators,
}: {
  token: string;
  campaignName: string;
  showPricing: boolean;
  creators: PublicShortlistCreator[];
}) {
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:py-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">Group 8A</p>
        <h1 className="text-xl font-semibold text-neutral-900 sm:text-2xl">{campaignName} — Creator Shortlist</h1>
        <p className="mt-2 text-sm text-neutral-500">
          This is feedback for Group 8A&rsquo;s review only. No creator is officially accepted or declined here.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-neutral-200 bg-white p-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="reviewerName">Reviewing as</FieldLabel>
          <Input
            id="reviewerName"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            placeholder="Your name"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="reviewerEmail">Email (optional)</FieldLabel>
          <Input
            id="reviewerEmail"
            type="email"
            value={reviewerEmail}
            onChange={(e) => setReviewerEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </Field>
      </div>

      {creators.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-500">No creators on the shortlist yet — check back soon.</p>
      ) : (
        <div className="space-y-4">
          {creators.map((creator) => (
            <CreatorFeedbackCard
              key={creator.campaignCreatorId}
              token={token}
              creator={creator}
              reviewerName={reviewerName}
              reviewerEmail={reviewerEmail}
              showPricing={showPricing}
            />
          ))}
        </div>
      )}
    </div>
  );
}
