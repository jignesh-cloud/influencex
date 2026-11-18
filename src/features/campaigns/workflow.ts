import type { CampaignDecision, CompensationType, WorkflowStatus } from "@/generated/prisma/enums";

const COMMISSION_COMPENSATION_TYPES: CompensationType[] = ["commission_only", "flat_fee_plus_commission"];

/**
 * CampaignWorkflowService — the only place that decides how
 * CampaignCreator.campaignDecision maps to workflowStatus. Decision is the
 * cause, workflowStatus is the derived effect (see architecture §8).
 * Never let ClientPreference or Creator.globalEligibilityStatus call this.
 */
export function resolveWorkflowStatusForDecision(
  decision: CampaignDecision,
  compensationType: CompensationType,
): WorkflowStatus {
  if (decision === "decline_for_campaign") return "declined_for_campaign";
  if (decision === "keep_pending") return "kept_pending";

  // accept_for_campaign
  return COMMISSION_COMPENSATION_TYPES.includes(compensationType) ? "ready_for_outreach" : "approved_complete";
}

/** Manual pre-decision pipeline stages a team member can move a row through
 * by hand, before Group 8A has made an official campaign decision. */
export const PRE_DECISION_STATUSES: WorkflowStatus[] = [
  "sourced",
  "pending_internal_review",
  "shortlisted",
  "sent_to_client",
  "client_feedback_received",
  "group8a_review",
];

/**
 * Once shortlisted, a creator stays visible on the public feedback link for
 * good — even after a later campaign decision. Removing them the moment
 * Group 8A declines would itself leak an internal decision through the
 * public page's visibility, which the client-facing spec explicitly forbids.
 */
const PRE_SHORTLIST_STATUSES: WorkflowStatus[] = ["sourced", "pending_internal_review"];

export function isVisibleOnPublicFeedbackLink(status: WorkflowStatus): boolean {
  return !PRE_SHORTLIST_STATUSES.includes(status);
}
