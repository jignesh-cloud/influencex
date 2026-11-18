"use client";

import { useState, useTransition } from "react";
import { overrideAiFit, rescoreCreatorFit } from "@/features/campaign-creators/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AIFitTier } from "@/generated/prisma/enums";

const AI_FIT_LABELS: Record<AIFitTier, string> = {
  strong_match: "Strong Match",
  partial_match: "Partial Match",
  poor_match: "Poor Match",
};

const AI_FIT_STYLES: Record<AIFitTier, string> = {
  strong_match: "bg-emerald-100 text-emerald-800",
  partial_match: "bg-amber-100 text-amber-800",
  poor_match: "bg-red-100 text-red-800",
};

export function AIFitCell({
  campaignCreatorId,
  tier,
  explanation,
}: {
  campaignCreatorId: string;
  tier: AIFitTier | null;
  explanation: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [draftTier, setDraftTier] = useState<AIFitTier>(tier ?? "partial_match");
  const [draftExplanation, setDraftExplanation] = useState(explanation ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRescore() {
    setError(null);
    startTransition(async () => {
      const outcome = await rescoreCreatorFit(campaignCreatorId);
      if (!outcome.success) setError(outcome.error);
      else {
        setDraftTier(outcome.result.tier);
        setDraftExplanation(outcome.result.explanation);
      }
    });
  }

  function handleSaveOverride() {
    startTransition(async () => {
      await overrideAiFit(campaignCreatorId, draftTier, draftExplanation);
      setOpen(false);
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button type="button" className="text-left">
            {tier ? <Badge className={AI_FIT_STYLES[tier]}>{AI_FIT_LABELS[tier]}</Badge> : <span className="text-neutral-400">Not scored</span>}
          </button>
        }
      />
      <PopoverContent className="w-80 space-y-3">
        <Field>
          <FieldLabel>Tier</FieldLabel>
          <Select value={draftTier} onValueChange={(v) => v && setDraftTier(v as AIFitTier)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strong_match">Strong Match</SelectItem>
              <SelectItem value="partial_match">Partial Match</SelectItem>
              <SelectItem value="poor_match">Poor Match</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Explanation</FieldLabel>
          <Textarea
            rows={4}
            value={draftExplanation}
            onChange={(e) => setDraftExplanation(e.target.value)}
          />
        </Field>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={isPending} onClick={handleRescore}>
            {isPending ? "Scoring…" : "Re-score with AI"}
          </Button>
          <Button size="sm" disabled={isPending} onClick={handleSaveOverride}>
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
