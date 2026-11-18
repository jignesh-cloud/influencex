import type { ClientPreferenceView } from "@/features/campaign-creators/types";

export type ClientFeedbackSummary = "interested" | "pass" | "negotiating" | "mixed" | "no_response";

/**
 * Derived on read from individual ClientPreference rows — never stored.
 * Multiple reviewers may disagree; "mixed" must never auto-resolve to a
 * final decision (see architecture §1).
 */
export function deriveClientFeedbackSummary(preferences: ClientPreferenceView[]): ClientFeedbackSummary {
  if (preferences.length === 0) return "no_response";
  const distinct = new Set(preferences.map((p) => p.preference));
  if (distinct.size > 1) return "mixed";
  const only = preferences[0].preference;
  if (only === "interested") return "interested";
  if (only === "negotiating") return "negotiating";
  return "pass";
}

export const CLIENT_FEEDBACK_LABELS: Record<ClientFeedbackSummary, string> = {
  interested: "Interested",
  pass: "Pass",
  negotiating: "Negotiating",
  mixed: "Mixed Feedback",
  no_response: "No Response",
};
