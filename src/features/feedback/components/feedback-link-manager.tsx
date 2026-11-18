"use client";

import { useState, useTransition } from "react";
import {
  createFeedbackLink,
  revokeFeedbackLink,
  regenerateFeedbackLink,
  updateFeedbackLinkExpiration,
} from "@/features/feedback/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface FeedbackLinkItem {
  id: string;
  token: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  createdBy: { name: string };
}

export function FeedbackLinkManager({
  campaignId,
  activeLink,
  baseUrl,
}: {
  campaignId: string;
  activeLink: FeedbackLinkItem | null;
  baseUrl: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const url = activeLink ? `${baseUrl}/feedback/${activeLink.token}` : null;

  function handleCopy() {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card className="space-y-3 p-5">
      <h2 className="font-semibold text-neutral-900">Client feedback link</h2>

      {activeLink && url ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input readOnly value={url} className="font-mono text-xs" />
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
            <span>Expires {activeLink.expiresAt.toLocaleDateString()}</span>
            <Input
              type="date"
              className="w-40"
              defaultValue={activeLink.expiresAt.toISOString().slice(0, 10)}
              onChange={(e) =>
                e.target.value &&
                startTransition(() => updateFeedbackLinkExpiration(activeLink.id, new Date(e.target.value).toISOString()))
              }
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await regenerateFeedbackLink(campaignId);
                })
              }
            >
              Regenerate
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={() => startTransition(() => revokeFeedbackLink(activeLink.id))}
            >
              Revoke
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-neutral-500">No active feedback link for this campaign.</p>
          <Button
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await createFeedbackLink(campaignId);
              })
            }
          >
            Create Feedback Link
          </Button>
        </div>
      )}
    </Card>
  );
}
