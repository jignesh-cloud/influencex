import type {
  AffiliateEnrollmentStatus,
  AffiliateNetwork,
  AIFitTier,
  CampaignDecision,
  CompensationType,
  ContentStatus,
  FlatFeePaymentStatus,
  UsageRightsGranted,
  WorkflowStatus,
} from "@/generated/prisma/enums";

export interface EnrollmentView {
  id: string;
  network: AffiliateNetwork;
  enrollmentStatus: AffiliateEnrollmentStatus;
  inviteLink: string | null;
  trackingLink: string | null;
  inviteEmailStatus: string | null;
  inviteEmailSentAt: Date | null;
}

export interface ClientPreferenceView {
  reviewerName: string;
  reviewerEmail: string | null;
  preference: "interested" | "pass_for_campaign" | "negotiating";
  comment: string | null;
  submittedAt: Date;
}

/** Flattened, table-friendly view of one CampaignCreator row. */
export interface CampaignCreatorRow {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string | null;

  instagramHandle: string | null;
  tiktokHandle: string | null;
  youtubeHandle: string | null;
  instagramFollowers: number | null;
  tiktokFollowers: number | null;
  youtubeFollowers: number | null;
  instagramEngagementRate: number | null;
  tiktokEngagementRate: number | null;
  youtubeEngagementRate: number | null;

  /** Representative follower/engagement figures — first platform with data. */
  followers: number | null;
  engagementRate: number | null;
  platforms: string;

  exampleContentCount: number;
  location: string | null;
  age: number | null;
  gender: string | null;

  workflowStatus: WorkflowStatus;
  campaignDecision: CampaignDecision;
  favorite: boolean;
  declinedReason: string | null;
  contentStatus: ContentStatus | null;

  pitchMessage: string | null;
  pitchEmailSentAt: Date | null;
  pitchEmailStatus: string | null;

  aiFitScore: AIFitTier | null;
  aiFitExplanation: string | null;
  teamNotes: string | null;

  compensationType: CompensationType;
  flatFeeAmount: number | null;
  flatFeePaymentStatus: FlatFeePaymentStatus | null;

  usageRightsGranted: UsageRightsGranted;
  usageRightsDuration: string | null;
  usageRightsFee: number | null;

  exclusivity: string | null;
  conversionRate: number | null;
  gmv: number | null;
  lastCampaignName: string | null;

  product: string | null;
  deliverables: string | null;

  clientPreferences: ClientPreferenceView[];
  latestEnrollment: EnrollmentView | null;
}
