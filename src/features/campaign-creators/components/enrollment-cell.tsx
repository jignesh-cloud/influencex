"use client";

import { useState, useTransition } from "react";
import {
  startCreatorEnrollment,
  syncCreatorEnrollment,
  sendCreatorAffiliateInvite,
} from "@/features/campaign-creators/actions";
import type { CampaignCreatorRow } from "@/features/campaign-creators/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AffiliateProgramOption {
  id: string;
  network: string;
  programName: string;
}

const STATUS_LABELS: Record<string, string> = {
  invite_created: "Invite Created",
  invited: "Invited",
  applied: "Applied",
  enrolled: "Enrolled",
  inactive: "Inactive",
};

const STATUS_STYLES: Record<string, string> = {
  invite_created: "bg-neutral-200 text-neutral-700",
  invited: "bg-amber-100 text-amber-800",
  applied: "bg-blue-100 text-blue-800",
  enrolled: "bg-emerald-100 text-emerald-800",
  inactive: "bg-red-100 text-red-800",
};

const COMMISSION_TYPES = new Set(["commission_only", "flat_fee_plus_commission"]);

function SendInviteControl({
  enrollmentId,
  campaignId,
  creatorEmail,
}: {
  enrollmentId: string;
  campaignId: string;
  creatorEmail: string | null;
}) {
  const [manualEmail, setManualEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    setError(null);
    startTransition(async () => {
      const result = await sendCreatorAffiliateInvite(enrollmentId, campaignId, manualEmail || undefined);
      if ("error" in result && result.error) setError(result.error);
    });
  }

  if (!creatorEmail) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-neutral-500">Creator email required before sending invitation.</p>
        <Input
          type="email"
          placeholder="creator@email.com"
          value={manualEmail}
          onChange={(e) => setManualEmail(e.target.value)}
          className="h-7 text-xs"
        />
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        <Button size="xs" disabled={!manualEmail || isPending} onClick={handleSend}>
          {isPending ? "Sending…" : "Save Email & Send Invite"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <Button size="xs" variant="outline" disabled={isPending} onClick={handleSend}>
        {isPending ? "Sending…" : "Send Invite"}
      </Button>
    </div>
  );
}

export function EnrollmentCell({
  row,
  campaignId,
  affiliatePrograms,
}: {
  row: CampaignCreatorRow;
  campaignId: string;
  affiliatePrograms: AffiliateProgramOption[];
}) {
  const [programId, setProgramId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const eligible = row.campaignDecision === "accept_for_campaign" && COMMISSION_TYPES.has(row.compensationType);

  if (row.latestEnrollment) {
    const enrollment = row.latestEnrollment;
    return (
      <div className="space-y-1">
        <Badge className={STATUS_STYLES[enrollment.enrollmentStatus]}>
          {STATUS_LABELS[enrollment.enrollmentStatus]}
        </Badge>
        <p className="text-xs text-neutral-500 capitalize">{enrollment.network}</p>
        {enrollment.trackingLink ? (
          <a
            href={enrollment.trackingLink}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-xs text-blue-600 hover:underline"
          >
            Tracking link
          </a>
        ) : null}

        {enrollment.enrollmentStatus === "invite_created" ? (
          <SendInviteControl enrollmentId={enrollment.id} campaignId={campaignId} creatorEmail={row.creatorEmail} />
        ) : null}

        {enrollment.inviteEmailStatus === "failed" ? (
          <p className="text-xs text-red-600">Invite email failed to send.</p>
        ) : null}

        {enrollment.enrollmentStatus === "invited" || enrollment.enrollmentStatus === "applied" ? (
          <Button
            size="xs"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await syncCreatorEnrollment(enrollment.id, campaignId);
              })
            }
          >
            {isPending ? "Syncing…" : "Sync Status"}
          </Button>
        ) : null}
      </div>
    );
  }

  if (!eligible) {
    return <span className="text-neutral-400">—</span>;
  }

  return (
    <Popover>
      <PopoverTrigger render={<Button size="xs" variant="outline" />}>Start Enrollment</PopoverTrigger>
      <PopoverContent className="w-72 space-y-3">
        {affiliatePrograms.length === 0 ? (
          <p className="text-sm text-neutral-500">No affiliate programs configured for this client.</p>
        ) : (
          <>
            <Select value={programId} onValueChange={(v) => setProgramId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select affiliate program" />
              </SelectTrigger>
              <SelectContent>
                {affiliatePrograms.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.programName} ({program.network})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
            <Button
              size="sm"
              disabled={!programId || isPending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const result = await startCreatorEnrollment(row.id, programId);
                  if (result?.error) setError(result.error);
                })
              }
            >
              {isPending ? "Starting…" : "Confirm"}
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
