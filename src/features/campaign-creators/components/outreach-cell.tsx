"use client";

import { useState, useTransition } from "react";
import { sendCreatorPitch } from "@/features/campaign-creators/actions";
import type { CampaignCreatorRow } from "@/features/campaign-creators/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function OutreachCell({ row }: { row: CampaignCreatorRow }) {
  const [manualEmail, setManualEmail] = useState("");
  const [pitchMessage, setPitchMessage] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    setError(null);
    startTransition(async () => {
      const result = await sendCreatorPitch(row.id, useCustom ? pitchMessage : undefined, manualEmail || undefined);
      if (result?.error) setError(result.error);
    });
  }

  if (row.pitchEmailSentAt) {
    return (
      <div className="space-y-1">
        <Badge variant={row.pitchEmailStatus === "sent" ? "default" : "secondary"}>
          {row.pitchEmailStatus === "sent" ? "Pitch sent" : "Pitch failed"}
        </Badge>
        <p className="text-xs text-neutral-500">{row.pitchMessage ? "Custom pitch" : "Generic pitch"}</p>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger render={<Button size="xs" variant="outline" />}>Send Pitch</PopoverTrigger>
      <PopoverContent className="w-80 space-y-3">
        {!row.creatorEmail ? (
          <div className="space-y-1">
            <p className="text-xs text-neutral-500">Creator email required before sending a pitch.</p>
            <Input
              type="email"
              placeholder="creator@email.com"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        ) : null}

        <div className="flex gap-2 text-sm">
          <Button type="button" size="xs" variant={!useCustom ? "default" : "outline"} onClick={() => setUseCustom(false)}>
            Generic pitch
          </Button>
          <Button type="button" size="xs" variant={useCustom ? "default" : "outline"} onClick={() => setUseCustom(true)}>
            Custom pitch
          </Button>
        </div>

        {useCustom ? (
          <Textarea
            placeholder="Write a custom pitch for this creator…"
            rows={4}
            value={pitchMessage}
            onChange={(e) => setPitchMessage(e.target.value)}
          />
        ) : (
          <p className="text-xs text-neutral-500">Sends the standard Group 8A outreach template.</p>
        )}

        {error ? <p className="text-xs text-red-600">{error}</p> : null}

        <Button
          size="sm"
          disabled={isPending || (!row.creatorEmail && !manualEmail) || (useCustom && !pitchMessage)}
          onClick={handleSend}
        >
          {isPending ? "Sending…" : "Send"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
