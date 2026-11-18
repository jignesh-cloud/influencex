"use client";

import { useState, useTransition } from "react";
import { confirmOnboarding } from "@/features/creator-onboarding/actions";
import { formatCurrency } from "@/features/campaign-creators/table/format";
import type { OnboardingPageState } from "@/features/creator-onboarding/queries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const COMPENSATION_LABELS: Record<string, string> = {
  gifting_only: "Gifting",
  commission_only: "Commission",
  flat_fee: "Flat fee",
  flat_fee_plus_commission: "Flat fee + commission",
};

export function OnboardingPage({ state, token }: { state: Extract<OnboardingPageState, { status: "active" }>; token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleContinue() {
    setError(null);
    startTransition(async () => {
      const result = await confirmOnboarding(token);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.inviteLink) {
        window.location.href = result.inviteLink;
      }
    });
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-10 sm:py-16">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">Group 8A</p>
        <h1 className="text-xl font-semibold text-neutral-900 sm:text-2xl">
          You&rsquo;re invited, {state.creatorName.split(" ")[0]}!
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {state.clientName} has selected you for their <strong>{state.campaignName}</strong> campaign.
        </p>
      </div>

      <Card className="space-y-3 p-5">
        <h2 className="font-semibold text-neutral-900">What to expect</h2>
        {state.product ? (
          <p className="text-sm text-neutral-600">
            <span className="font-medium text-neutral-800">Product: </span>
            {state.product}
          </p>
        ) : null}
        {state.deliverables ? (
          <p className="text-sm text-neutral-600">
            <span className="font-medium text-neutral-800">Deliverables: </span>
            {state.deliverables}
          </p>
        ) : null}
        {state.contentStyle ? (
          <p className="text-sm text-neutral-600">
            <span className="font-medium text-neutral-800">Content format: </span>
            {state.contentStyle}
          </p>
        ) : null}
        {state.usageRightsExpectations ? (
          <p className="text-sm text-neutral-600">
            <span className="font-medium text-neutral-800">Usage rights: </span>
            {state.usageRightsExpectations}
          </p>
        ) : null}
        <p className="text-sm text-neutral-600">
          <span className="font-medium text-neutral-800">Compensation: </span>
          {COMPENSATION_LABELS[state.compensationType] ?? state.compensationType}
          {state.flatFeeAmount ? ` · ${formatCurrency(state.flatFeeAmount)}` : ""}
        </p>
      </Card>

      <Card className="space-y-3 p-5">
        <h2 className="font-semibold text-neutral-900">Get started</h2>
        <p className="text-sm text-neutral-600">
          Next, you&rsquo;ll complete your affiliate signup with our partner network ({state.network}) so we can set up
          your tracking link and payouts.
        </p>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button disabled={isPending || !state.inviteLink} onClick={handleContinue}>
          {isPending ? "Redirecting…" : state.alreadyConfirmed ? "Continue to Signup" : "I'm In — Continue to Signup"}
        </Button>
      </Card>
    </div>
  );
}
