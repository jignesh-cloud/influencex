"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import type { CampaignCreatorRow } from "@/features/campaign-creators/types";

const PREFERENCE_STYLES: Record<string, string> = {
  interested: "bg-emerald-100 text-emerald-800",
  negotiating: "bg-blue-100 text-blue-800",
  pass_for_campaign: "bg-neutral-200 text-neutral-600",
};

const PREFERENCE_LABELS: Record<string, string> = {
  interested: "Interested",
  negotiating: "Negotiating",
  pass_for_campaign: "Pass",
};

export function ClientFeedbackSheet({
  row,
  onOpenChange,
}: {
  row: CampaignCreatorRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={row !== null} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{row?.creatorName}</SheetTitle>
          <SheetDescription>Client feedback — never an official accept/decline.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-4">
          {row?.aiFitExplanation ? (
            <div>
              <p className="text-xs font-medium uppercase text-neutral-500">AI fit explanation</p>
              <p className="text-sm text-neutral-700">{row.aiFitExplanation}</p>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-xs font-medium uppercase text-neutral-500">Reviewer responses</p>
            {!row || row.clientPreferences.length === 0 ? (
              <p className="text-sm text-neutral-500">No client responses yet.</p>
            ) : (
              <ul className="space-y-3">
                {row.clientPreferences.map((preference, index) => (
                  <li key={index} className="rounded-md border border-neutral-200 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-900">{preference.reviewerName}</span>
                      <Badge className={PREFERENCE_STYLES[preference.preference]}>
                        {PREFERENCE_LABELS[preference.preference]}
                      </Badge>
                    </div>
                    {preference.comment ? (
                      <p className="mt-1 text-sm text-neutral-600">{preference.comment}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-neutral-400">
                      {preference.submittedAt.toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
