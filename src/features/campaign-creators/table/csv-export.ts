import type { CampaignCreatorRow } from "@/features/campaign-creators/types";
import { CLIENT_FEEDBACK_LABELS, deriveClientFeedbackSummary } from "@/features/campaign-creators/client-feedback";
import { WORKFLOW_STATUS_LABELS } from "@/features/campaign-creators/table/columns";
import { formatCurrency, formatFollowers, formatPercent } from "@/features/campaign-creators/table/format";

/** Mirrors each column's cell display as a plain string, for CSV export. */
export function columnCsvValue(row: CampaignCreatorRow, columnId: string): string {
  switch (columnId) {
    case "favorite":
      return row.favorite ? "Yes" : "No";
    case "creatorName":
      return row.creatorName;
    case "followers":
      return formatFollowers(row.followers);
    case "engagementRate":
      return formatPercent(row.engagementRate);
    case "aiFitScore":
      return row.aiFitScore ?? "";
    case "exampleContent":
      return String(row.exampleContentCount);
    case "compensationType":
      return row.compensationType;
    case "flatFeeAmount":
      return formatCurrency(row.flatFeeAmount);
    case "workflowStatus":
      return WORKFLOW_STATUS_LABELS[row.workflowStatus];
    case "clientFeedback":
      return CLIENT_FEEDBACK_LABELS[deriveClientFeedbackSummary(row.clientPreferences)];
    case "campaignDecision":
      return row.campaignDecision;
    case "location":
      return row.location ?? "";
    case "age":
      return row.age?.toString() ?? "";
    case "gender":
      return row.gender ?? "";
    case "platforms":
      return row.platforms;
    case "otherHandles":
      return [row.instagramHandle, row.tiktokHandle, row.youtubeHandle].filter(Boolean).join(" | ");
    case "platformFollowers":
      return [row.instagramFollowers, row.tiktokFollowers, row.youtubeFollowers]
        .map((v) => formatFollowers(v))
        .join(" | ");
    case "platformEngagement":
      return [row.instagramEngagementRate, row.tiktokEngagementRate, row.youtubeEngagementRate]
        .map((v) => formatPercent(v))
        .join(" | ");
    case "product":
      return row.product ?? "";
    case "deliverables":
      return row.deliverables ?? "";
    case "usageRightsGranted":
      return row.usageRightsGranted;
    case "usageRightsDuration":
      return row.usageRightsDuration ?? "";
    case "usageRightsFee":
      return formatCurrency(row.usageRightsFee);
    case "exclusivity":
      return row.exclusivity ?? "";
    case "conversionRate":
      return formatPercent(row.conversionRate);
    case "gmv":
      return formatCurrency(row.gmv);
    case "lastCampaignName":
      return row.lastCampaignName ?? "";
    case "declinedReason":
      return row.declinedReason ?? "";
    case "affiliateEnrollment":
      return row.latestEnrollment
        ? `${row.latestEnrollment.network}: ${row.latestEnrollment.enrollmentStatus}`
        : "";
    case "contentStatus":
      return row.contentStatus ?? "";
    case "outreach":
      return row.pitchEmailSentAt ? row.pitchEmailStatus ?? "" : "";
    default:
      return "";
  }
}

function escapeCsvCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Triggers a browser download of the given rows as CSV. Headers/values are
 * already-resolved strings — callers decide which columns/cells to include. */
export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(","));
  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
