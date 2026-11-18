"use client";

import { useState, useTransition } from "react";
import { blockCreatorGlobally, unblockCreatorGlobally } from "@/features/creators/actions";
import { BLOCK_REASONS } from "@/validators/creator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const REASON_LABELS: Record<string, string> = {
  inappropriate_or_offensive_content: "Inappropriate or offensive content",
  fraudulent_followers_or_engagement: "Fraudulent followers or engagement",
  brand_safety_concern: "Brand safety concern",
  unprofessional_conduct: "Unprofessional conduct",
  previous_campaign_issue: "Previous campaign issue",
  legal_or_compliance_concern: "Legal or compliance concern",
  do_not_contact: "Do not contact",
  other: "Other",
};

export function GlobalEligibilityControl({
  creatorId,
  isBlocked,
  isAdmin,
}: {
  creatorId: string;
  isBlocked: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isAdmin) return null;

  if (isBlocked) {
    return (
      <Button
        variant="outline"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await unblockCreatorGlobally(creatorId);
          })
        }
      >
        {isPending ? "Unblocking…" : "Unblock Creator"}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" />}>Block Creator Globally</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block creator globally</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field data-invalid={!!error}>
            <FieldLabel>Reason</FieldLabel>
            <Select value={reason} onValueChange={(v) => setReason(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {BLOCK_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {REASON_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error ? <FieldError errors={[{ message: error }]} /> : null}
          </Field>
          <Field>
            <FieldLabel htmlFor="notes">Additional notes (optional)</FieldLabel>
            <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <p className="text-xs text-neutral-500">
            This blocks the creator from all future campaigns until manually unblocked. It does not affect any
            existing campaign decisions.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={!reason || isPending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await blockCreatorGlobally(creatorId, { reason: reason as never, notes });
                if (result?.error) {
                  setError(result.error);
                } else {
                  setOpen(false);
                }
              });
            }}
          >
            {isPending ? "Blocking…" : "Block creator"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
