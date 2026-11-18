"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";
import { campaignTableFeatures } from "@/features/campaign-creators/table/table-features";
import type { CampaignCreatorRow } from "@/features/campaign-creators/types";
import { deriveClientFeedbackSummary, CLIENT_FEEDBACK_LABELS } from "@/features/campaign-creators/client-feedback";
import { formatFollowers, formatPercent, formatCurrency } from "@/features/campaign-creators/table/format";
import { setCampaignDecision, setWorkflowStatus, toggleFavorite } from "@/features/campaign-creators/actions";
import { AIFitCell } from "@/features/campaign-creators/components/ai-fit-cell";
import { EnrollmentCell } from "@/features/campaign-creators/components/enrollment-cell";
import { ContentStatusCell } from "@/features/campaign-creators/components/content-status-cell";
import { OutreachCell } from "@/features/campaign-creators/components/outreach-cell";
import { PRE_DECISION_STATUSES } from "@/features/campaigns/workflow";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CampaignDecision, WorkflowStatus } from "@/generated/prisma/enums";

const helper = createColumnHelper<typeof campaignTableFeatures, CampaignCreatorRow>();

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  sourced: "Sourced",
  pending_internal_review: "Pending Internal Review",
  shortlisted: "Shortlisted",
  sent_to_client: "Sent to Client",
  client_feedback_received: "Client Feedback Received",
  group8a_review: "Group 8A Review",
  ready_for_outreach: "Ready for Outreach",
  invite_created: "Invite Created",
  invite_sent: "Invite Sent",
  affiliate_application_pending: "Affiliate Application Pending",
  enrolled_active: "Enrolled / Active",
  approved_complete: "Approved / Complete",
  declined_for_campaign: "Declined for This Campaign",
  kept_pending: "Under Review",
};

const COMPENSATION_LABELS: Record<string, string> = {
  gifting_only: "Gifting only",
  commission_only: "Commission only",
  flat_fee: "Flat fee",
  flat_fee_plus_commission: "Flat fee + commission",
};

const FEEDBACK_BADGE_STYLES: Record<string, string> = {
  interested: "bg-emerald-100 text-emerald-800",
  pass: "bg-neutral-200 text-neutral-600",
  negotiating: "bg-blue-100 text-blue-800",
  mixed: "bg-amber-100 text-amber-800",
  no_response: "bg-neutral-100 text-neutral-400",
};

function FavoriteCell({ row }: { row: CampaignCreatorRow }) {
  return (
    <button
      type="button"
      aria-label={row.favorite ? "Unfavorite" : "Favorite"}
      onClick={() => toggleFavorite(row.id, !row.favorite)}
      className="text-neutral-300 hover:text-brand"
    >
      <Star className={row.favorite ? "fill-brand text-brand" : ""} size={16} />
    </button>
  );
}

function WorkflowStatusCell({ row }: { row: CampaignCreatorRow }) {
  const isManuallyEditable = PRE_DECISION_STATUSES.includes(row.workflowStatus);

  if (!isManuallyEditable) {
    return <Badge variant="secondary">{WORKFLOW_STATUS_LABELS[row.workflowStatus]}</Badge>;
  }

  return (
    <Select
      value={row.workflowStatus}
      onValueChange={(value) => setWorkflowStatus(row.id, value as WorkflowStatus)}
    >
      <SelectTrigger size="sm" className="w-[190px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PRE_DECISION_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {WORKFLOW_STATUS_LABELS[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DecisionCell({ row }: { row: CampaignCreatorRow }) {
  return (
    <Select
      value={row.campaignDecision}
      onValueChange={(value) => setCampaignDecision(row.id, value as CampaignDecision)}
    >
      <SelectTrigger size="sm" className="w-[210px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="accept_for_campaign">Accept for This Campaign</SelectItem>
        <SelectItem value="decline_for_campaign">Decline for This Campaign</SelectItem>
        <SelectItem value="keep_pending">Keep Pending</SelectItem>
      </SelectContent>
    </Select>
  );
}

interface AffiliateProgramOption {
  id: string;
  network: string;
  programName: string;
}

export function buildColumns(
  onOpenFeedback: (row: CampaignCreatorRow) => void,
  campaignId: string,
  affiliatePrograms: AffiliateProgramOption[],
) {
  return helper.columns([
    helper.display({
      id: "favorite",
      header: "",
      enableHiding: false,
      cell: ({ row }) => <FavoriteCell row={row.original} />,
    }),
    helper.accessor("creatorName", {
      id: "creatorName",
      header: "Creator",
      enableHiding: false,
      cell: ({ row }) => (
        <div>
          <Link href={`/creators/${row.original.creatorId}`} className="font-medium text-neutral-900 hover:underline">
            {row.original.creatorName}
          </Link>
          <p className="text-xs text-neutral-500">
            @{row.original.instagramHandle ?? row.original.tiktokHandle ?? row.original.youtubeHandle ?? "—"}
          </p>
        </div>
      ),
    }),
    helper.accessor("followers", {
      id: "followers",
      header: "Followers",
      cell: ({ getValue }) => formatFollowers(getValue()),
    }),
    helper.accessor("engagementRate", {
      id: "engagementRate",
      header: "Engagement Rate",
      cell: ({ getValue }) => formatPercent(getValue()),
    }),
    helper.accessor("aiFitScore", {
      id: "aiFitScore",
      header: "AI Fit",
      cell: ({ row }) => (
        <AIFitCell
          campaignCreatorId={row.original.id}
          tier={row.original.aiFitScore}
          explanation={row.original.aiFitExplanation}
        />
      ),
    }),
    helper.accessor("exampleContentCount", {
      id: "exampleContent",
      header: "Example Content",
      enableSorting: false,
      cell: ({ getValue }) => {
        const count = getValue();
        return count > 0 ? `${count} item${count === 1 ? "" : "s"}` : "—";
      },
    }),
    helper.accessor("compensationType", {
      id: "compensationType",
      header: "Compensation",
      cell: ({ getValue }) => COMPENSATION_LABELS[getValue()],
    }),
    helper.accessor("flatFeeAmount", {
      id: "flatFeeAmount",
      header: "Flat Fee",
      cell: ({ getValue }) => formatCurrency(getValue()),
    }),
    helper.accessor("workflowStatus", {
      id: "workflowStatus",
      header: "Workflow Status",
      cell: ({ row }) => <WorkflowStatusCell row={row.original} />,
    }),
    helper.display({
      id: "clientFeedback",
      header: "Client Feedback",
      cell: ({ row }) => {
        const summary = deriveClientFeedbackSummary(row.original.clientPreferences);
        return (
          <button type="button" onClick={() => onOpenFeedback(row.original)} className="text-left">
            <Badge className={FEEDBACK_BADGE_STYLES[summary]}>{CLIENT_FEEDBACK_LABELS[summary]}</Badge>
          </button>
        );
      },
    }),
    helper.display({
      id: "campaignDecision",
      header: "Group 8A Decision",
      cell: ({ row }) => <DecisionCell row={row.original} />,
    }),
    helper.display({
      id: "affiliateEnrollment",
      header: "Affiliate Enrollment",
      cell: ({ row }) => (
        <EnrollmentCell row={row.original} campaignId={campaignId} affiliatePrograms={affiliatePrograms} />
      ),
    }),
    helper.display({
      id: "contentStatus",
      header: "Content Status",
      cell: ({ row }) => <ContentStatusCell row={row.original} />,
    }),
    helper.display({
      id: "outreach",
      header: "Outreach",
      cell: ({ row }) => <OutreachCell row={row.original} />,
    }),

    // Optional columns — hidden by default, toggled via the column visibility menu.
    helper.accessor("location", { id: "location", header: "Location", cell: ({ getValue }) => getValue() ?? "—" }),
    helper.accessor("age", { id: "age", header: "Age", cell: ({ getValue }) => getValue() ?? "—" }),
    helper.accessor("gender", { id: "gender", header: "Gender", cell: ({ getValue }) => getValue() ?? "—" }),
    helper.accessor("platforms", { id: "platforms", header: "Platform", cell: ({ getValue }) => getValue() || "—" }),
    helper.display({
      id: "otherHandles",
      header: "Other Handles",
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        const handles = [
          r.instagramHandle && `IG @${r.instagramHandle}`,
          r.tiktokHandle && `TT @${r.tiktokHandle}`,
          r.youtubeHandle && `YT @${r.youtubeHandle}`,
        ].filter(Boolean);
        return handles.length > 0 ? handles.join(" · ") : "—";
      },
    }),
    helper.display({
      id: "platformFollowers",
      header: "Platform Followers",
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        return [
          r.instagramFollowers !== null && `IG ${formatFollowers(r.instagramFollowers)}`,
          r.tiktokFollowers !== null && `TT ${formatFollowers(r.tiktokFollowers)}`,
          r.youtubeFollowers !== null && `YT ${formatFollowers(r.youtubeFollowers)}`,
        ]
          .filter(Boolean)
          .join(" · ") || "—";
      },
    }),
    helper.display({
      id: "platformEngagement",
      header: "Platform Engagement",
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        return [
          r.instagramEngagementRate !== null && `IG ${formatPercent(r.instagramEngagementRate)}`,
          r.tiktokEngagementRate !== null && `TT ${formatPercent(r.tiktokEngagementRate)}`,
          r.youtubeEngagementRate !== null && `YT ${formatPercent(r.youtubeEngagementRate)}`,
        ]
          .filter(Boolean)
          .join(" · ") || "—";
      },
    }),
    helper.accessor("product", { id: "product", header: "Product", cell: ({ getValue }) => getValue() ?? "—" }),
    helper.accessor("deliverables", {
      id: "deliverables",
      header: "Deliverables",
      cell: ({ getValue }) => getValue() ?? "—",
    }),
    helper.accessor("usageRightsGranted", { id: "usageRightsGranted", header: "Usage Rights Granted" }),
    helper.accessor("usageRightsDuration", {
      id: "usageRightsDuration",
      header: "Usage Rights Duration",
      cell: ({ getValue }) => getValue() ?? "—",
    }),
    helper.accessor("usageRightsFee", {
      id: "usageRightsFee",
      header: "Usage Rights Fee",
      cell: ({ getValue }) => formatCurrency(getValue()),
    }),
    helper.accessor("exclusivity", {
      id: "exclusivity",
      header: "Exclusivity",
      cell: ({ getValue }) => getValue() ?? "—",
    }),
    helper.accessor("conversionRate", {
      id: "conversionRate",
      header: "Conversion Rate",
      cell: ({ getValue }) => formatPercent(getValue()),
    }),
    helper.accessor("gmv", { id: "gmv", header: "GMV", cell: ({ getValue }) => formatCurrency(getValue()) }),
    helper.accessor("lastCampaignName", {
      id: "lastCampaignName",
      header: "Last Campaign",
      cell: ({ getValue }) => getValue() ?? "—",
    }),
    helper.accessor("declinedReason", {
      id: "declinedReason",
      header: "Declined Reason",
      cell: ({ getValue }) => getValue() ?? "—",
    }),
  ]);
}

export const DEFAULT_VISIBLE_COLUMNS = [
  "favorite",
  "creatorName",
  "followers",
  "engagementRate",
  "aiFitScore",
  "exampleContent",
  "compensationType",
  "flatFeeAmount",
  "workflowStatus",
  "clientFeedback",
  "campaignDecision",
  "affiliateEnrollment",
  "contentStatus",
  "outreach",
];
