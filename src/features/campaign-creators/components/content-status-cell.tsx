"use client";

import { useTransition } from "react";
import { setContentStatus } from "@/features/campaign-creators/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CampaignCreatorRow } from "@/features/campaign-creators/types";
import type { ContentStatus } from "@/generated/prisma/enums";

const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  pending_content: "Pending Content",
  active_content: "Active Content",
};

const READY_FOR_CONTENT_STATUSES = new Set(["enrolled_active", "approved_complete"]);

export function ContentStatusCell({ row }: { row: CampaignCreatorRow }) {
  const [isPending, startTransition] = useTransition();

  if (!READY_FOR_CONTENT_STATUSES.has(row.workflowStatus)) {
    return <span className="text-neutral-400">—</span>;
  }

  return (
    <Select
      value={row.contentStatus ?? undefined}
      disabled={isPending}
      onValueChange={(v) => v && startTransition(() => setContentStatus(row.id, v as ContentStatus))}
    >
      <SelectTrigger size="sm" className="w-[160px]">
        <SelectValue placeholder="Set status" />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(CONTENT_STATUS_LABELS) as [ContentStatus, string][]).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
