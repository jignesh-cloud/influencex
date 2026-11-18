import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // --- Users ---------------------------------------------------------------
  const jignesh = await prisma.user.upsert({
    where: { email: "jignesh@group8a.com" },
    update: {},
    create: { name: "Jignesh", email: "jignesh@group8a.com", role: "admin" },
  });

  const alex = await prisma.user.upsert({
    where: { email: "alex.kim@group8a.com" },
    update: {},
    create: { name: "Alex Kim", email: "alex.kim@group8a.com", role: "team_member" },
  });

  // --- Clients ---------------------------------------------------------------
  const rltHome = await prisma.client.create({
    data: {
      name: "RLT Home",
      contactName: "Morgan Lee",
      contactEmail: "morgan@rlthome.com",
      standingContentGuidelines:
        "No profanity. Product must appear on-screen within the first 3 seconds of any video content.",
    },
  });

  const rileyHome = await prisma.client.create({
    data: {
      name: "Riley Home",
      contactName: "Casey Nguyen",
      contactEmail: "casey@rileyhome.com",
      standingContentGuidelines:
        "Warm, cozy aesthetic. Avoid cluttered backgrounds and harsh studio lighting.",
    },
  });

  const saalt = await prisma.client.create({
    data: {
      name: "Saalt",
      contactName: "Jordan Blake",
      contactEmail: "jordan@saalt.com",
      standingContentGuidelines: "Body-positive messaging only. No medical claims.",
    },
  });

  // --- Content guideline templates --------------------------------------------
  const globalTemplate = await prisma.contentGuidelineTemplate.create({
    data: {
      clientId: null,
      name: "Group 8A Standard Guidelines",
      rules: [
        "Disclose paid partnerships per FTC guidelines (#ad or #sponsored)",
        "No competitor products visible in frame",
        "Submit content for review 48 hours before posting",
      ],
    },
  });

  const rileyHomeTemplate = await prisma.contentGuidelineTemplate.create({
    data: {
      clientId: rileyHome.id,
      name: "Riley Home — Cozy Aesthetic Guidelines",
      rules: [
        "Natural, warm lighting only — no harsh overhead lighting",
        "Feature at least one full room shot alongside product close-ups",
        "Avoid visible branding from other home goods companies",
      ],
    },
  });

  // --- Affiliate program -------------------------------------------------------
  const rileyHomeImpactProgram = await prisma.affiliateProgram.create({
    data: {
      clientId: rileyHome.id,
      network: "impact",
      programName: "Riley Home Creator Program",
      externalProgramId: "mock-impact-riley-home",
      active: true,
    },
  });

  // --- Campaign: Cozy Home Wellness (Riley Home) --------------------------------
  const cozyHomeWellness = await prisma.campaign.create({
    data: {
      clientId: rileyHome.id,
      name: "Cozy Home Wellness",
      status: "active",
      product: "Cozy Home Wellness Collection",
      platforms: ["instagram"],
      nicheKeywords: ["home", "wellness", "cozy", "self-care"],
      targetCreatorLocations: ["United States"],
      targetAudienceLocations: ["United States"],
      audienceDemographics: { ageRanges: ["25-34", "35-44"], genders: ["female"] },
      followerSizeMin: 5000,
      followerSizeMax: 100000,
      contentStyle: "Warm, natural lighting, cozy home aesthetic",
      deliverables: "1 Instagram feed post + 2 Instagram Stories",
      defaultCompensationType: "flat_fee_plus_commission",
      usageRightsExpectations: "90 days paid social usage",
      excludedContentTypes: ["explicit_content", "political_content"],
      defaultAffiliateProgramId: rileyHomeImpactProgram.id,
      clientFeedbackDisplaySettings: { showPricing: false },
      contentGuidelineTemplateId: rileyHomeTemplate.id,
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-11-30"),
      createdById: alex.id,
    },
  });

  // Saalt is seeded per spec as an existing client with no active campaign yet.
  void saalt;
  void globalTemplate;

  // --- Creators ------------------------------------------------------------------
  const maren = await prisma.creator.create({
    data: {
      name: "Maren Colby",
      email: "maren.colby@example.com",
      instagramHandle: "marencolby",
      instagramFollowers: 18200,
      instagramEngagementRate: 5.4,
      location: "Austin, TX",
      age: 29,
      gender: "female",
      interests: ["home decor", "wellness", "slow living"],
      verticalTags: ["home", "wellness", "lifestyle"],
      credibilityScore: 82,
      averageLikes: 1240,
      averageViews: 15800,
      dataProviderName: "mock",
      dataProviderExternalId: "mock-maren-colby",
      dataLastRefreshedAt: new Date(),
    },
  });

  const priya = await prisma.creator.create({
    data: {
      name: "Priya Nandan",
      email: "priya.nandan@example.com",
      instagramHandle: "priyanandan",
      instagramFollowers: 9600,
      instagramEngagementRate: 6.1,
      location: "San Francisco, CA",
      age: 26,
      gender: "female",
      interests: ["wellness", "beauty", "self-care"],
      verticalTags: ["wellness", "beauty"],
      credibilityScore: 78,
      averageLikes: 690,
      averageViews: 8400,
      dataProviderName: "mock",
      dataProviderExternalId: "mock-priya-nandan",
      dataLastRefreshedAt: new Date(),
    },
  });

  const dana = await prisma.creator.create({
    data: {
      name: "Dana Whitfield",
      email: "dana.whitfield@example.com",
      instagramHandle: "danawhitfield",
      instagramFollowers: 22400,
      instagramEngagementRate: 4.2,
      location: "Denver, CO",
      age: 34,
      gender: "female",
      interests: ["home organization", "minimalism"],
      verticalTags: ["home"],
      credibilityScore: 74,
      averageLikes: 980,
      averageViews: 11200,
      dataProviderName: "mock",
      dataProviderExternalId: "mock-dana-whitfield",
      dataLastRefreshedAt: new Date(),
    },
  });

  const jordan = await prisma.creator.create({
    data: {
      name: "Jordan Ellis",
      email: "jordan.ellis@example.com",
      instagramHandle: "jordanellis",
      instagramFollowers: 34000,
      instagramEngagementRate: 3.1,
      location: "Los Angeles, CA",
      gender: "female",
      interests: ["beauty"],
      verticalTags: ["beauty"],
      credibilityScore: 41,
      dataProviderName: "mock",
      dataProviderExternalId: "mock-jordan-ellis",
      dataLastRefreshedAt: new Date(),
      // Globally blocked — independent of any campaign decision (see architecture §12).
      globalEligibilityStatus: "unfit_globally_blocked",
      globalBlockReason: "brand_safety_concern",
      globalBlockNotes:
        "Flagged for undisclosed sponsored content and brand-safety concerns raised by a prior partner.",
      blockedById: jignesh.id,
      blockedAt: new Date("2026-07-15"),
    },
  });

  // --- CampaignCreator rows for Cozy Home Wellness --------------------------------

  // Maren Colby — Strong AI fit, mixed client feedback, Group 8A still deciding.
  const marenRow = await prisma.campaignCreator.create({
    data: {
      campaignId: cozyHomeWellness.id,
      creatorId: maren.id,
      workflowStatus: "group8a_review",
      campaignDecision: "keep_pending",
      aiFitScore: "strong_match",
      aiFitExplanation:
        "Strong alignment with the home & wellness niche; audience demographics match the target (25-34, female, US); engagement consistently above tier average.",
      compensationType: "flat_fee_plus_commission",
      flatFeeAmount: 450.0,
      flatFeePaymentStatus: "unpaid",
      usageRightsGranted: "negotiable",
      usageRightsDuration: "90 days",
    },
  });

  await prisma.clientPreference.create({
    data: {
      campaignCreatorId: marenRow.id,
      reviewerName: "Casey Nguyen",
      reviewerEmail: "casey@rileyhome.com",
      preference: "interested",
      comment: "Love her aesthetic — feels right for the collection.",
    },
  });

  await prisma.clientPreference.create({
    data: {
      campaignCreatorId: marenRow.id,
      reviewerName: "Jamie Park",
      reviewerEmail: "jamie@rileyhome.com",
      preference: "pass_for_campaign",
      comment: "Not quite the vibe we're going for this quarter.",
    },
  });

  // Priya Nandan — Partial AI fit, client interested, Group 8A accepted.
  await prisma.campaignCreator.create({
    data: {
      campaignId: cozyHomeWellness.id,
      creatorId: priya.id,
      workflowStatus: "ready_for_outreach",
      campaignDecision: "accept_for_campaign",
      decidedAt: new Date("2026-09-02"),
      aiFitScore: "partial_match",
      aiFitExplanation:
        "Good engagement and niche fit, but audience skews slightly younger than the campaign's target demographic.",
      compensationType: "flat_fee_plus_commission",
      flatFeeAmount: 300.0,
      flatFeePaymentStatus: "unpaid",
      usageRightsGranted: "negotiable",
      usageRightsDuration: "90 days",
      clientPreferences: {
        create: {
          reviewerName: "Casey Nguyen",
          reviewerEmail: "casey@rileyhome.com",
          preference: "interested",
          comment: "Perfect fit for our spring launch.",
        },
      },
    },
  });

  // Dana Whitfield — still in internal review, not yet sent to client.
  await prisma.campaignCreator.create({
    data: {
      campaignId: cozyHomeWellness.id,
      creatorId: dana.id,
      workflowStatus: "pending_internal_review",
      campaignDecision: "keep_pending",
      aiFitScore: "partial_match",
      aiFitExplanation:
        "Solid home-vertical presence, but audience size is at the lower edge of the campaign's target follower range.",
      compensationType: "flat_fee_plus_commission",
    },
  });

  // Jordan Ellis is intentionally NOT attached to this campaign — she's seeded
  // purely as a Creator Directory example of a globally blocked creator,
  // independent of any specific campaign outcome.
  void jordan;

  // --- A live client feedback link for the campaign -----------------------------
  await prisma.clientFeedbackLink.create({
    data: {
      campaignId: cozyHomeWellness.id,
      token: "mock-token-cozy-home-wellness-000001",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdById: alex.id,
    },
  });

  // --- Recent activity feed examples --------------------------------------------
  await prisma.activityLog.create({
    data: {
      entityType: "campaign",
      entityId: cozyHomeWellness.id,
      actorType: "external_reviewer",
      actorName: "Casey Nguyen",
      action: "client_feedback_received",
      detail: { message: "Client feedback received for 2 creators on Riley Home" },
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
  });

  await prisma.activityLog.create({
    data: {
      entityType: "client",
      entityId: rltHome.id,
      actorType: "user",
      actorId: alex.id,
      actorName: alex.name,
      action: "creator_sourced",
      detail: { message: "New creator sourced for RLT Home campaign" },
      createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
    },
  });

  await prisma.activityLog.create({
    data: {
      entityType: "creator",
      entityId: maren.id,
      actorType: "system",
      action: "affiliate_link_generated",
      detail: { message: "Affiliate link generated for Maren Colby" },
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
