"use client";

import { useState, useTransition } from "react";
import { addCreatorToCampaign } from "@/features/creators/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CampaignOption {
  id: string;
  name: string;
  client: { name: string };
}

export function AddToCampaignDialog({
  creatorId,
  campaigns,
  disabled,
  disabledReason,
}: {
  creatorId: string;
  campaigns: CampaignOption[];
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [open, setOpen] = useState(false);
  const [campaignId, setCampaignId] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!campaignId) return;
    startTransition(async () => {
      const result = await addCreatorToCampaign(creatorId, campaignId);
      setMessage(result.alreadyAdded ? "Already on this campaign." : "Added to campaign.");
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setMessage(null);
          setCampaignId("");
        }
      }}
    >
      <DialogTrigger render={<Button disabled={disabled} title={disabled ? disabledReason : undefined} />}>
        Add to Campaign
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to campaign</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <p className="text-sm text-neutral-500">No open campaigns to add this creator to.</p>
          ) : (
            <Select value={campaignId} onValueChange={(v) => setCampaignId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name} — {campaign.client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {message ? <p className="text-sm text-neutral-600">{message}</p> : null}
        </div>
        <DialogFooter>
          <Button onClick={handleAdd} disabled={!campaignId || isPending}>
            {isPending ? "Adding…" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
