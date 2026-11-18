-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'team_member');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'active', 'completed');

-- CreateEnum
CREATE TYPE "CompensationType" AS ENUM ('gifting_only', 'commission_only', 'flat_fee', 'flat_fee_plus_commission');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('sourced', 'pending_internal_review', 'shortlisted', 'sent_to_client', 'client_feedback_received', 'group8a_review', 'ready_for_outreach', 'invite_created', 'invite_sent', 'affiliate_application_pending', 'enrolled_active', 'approved_complete', 'declined_for_campaign', 'kept_pending');

-- CreateEnum
CREATE TYPE "CampaignDecision" AS ENUM ('accept_for_campaign', 'decline_for_campaign', 'keep_pending');

-- CreateEnum
CREATE TYPE "FlatFeePaymentStatus" AS ENUM ('unpaid', 'paid');

-- CreateEnum
CREATE TYPE "UsageRightsGranted" AS ENUM ('yes', 'no', 'negotiable');

-- CreateEnum
CREATE TYPE "GlobalEligibilityStatus" AS ENUM ('eligible_for_future_campaigns', 'unfit_globally_blocked');

-- CreateEnum
CREATE TYPE "GlobalBlockReason" AS ENUM ('inappropriate_or_offensive_content', 'fraudulent_followers_or_engagement', 'brand_safety_concern', 'unprofessional_conduct', 'previous_campaign_issue', 'legal_or_compliance_concern', 'do_not_contact', 'other');

-- CreateEnum
CREATE TYPE "ClientPreferenceValue" AS ENUM ('interested', 'pass_for_campaign');

-- CreateEnum
CREATE TYPE "AffiliateNetwork" AS ENUM ('impact', 'awin', 'avantlink');

-- CreateEnum
CREATE TYPE "AffiliateEnrollmentStatus" AS ENUM ('invite_created', 'invited', 'applied', 'enrolled', 'inactive');

-- CreateEnum
CREATE TYPE "InviteEmailStatus" AS ENUM ('sent', 'failed', 'bounced');

-- CreateEnum
CREATE TYPE "SavedViewPageScope" AS ENUM ('campaign_dashboard', 'all_campaign_dashboards', 'creator_directory');

-- CreateEnum
CREATE TYPE "ActivityActorType" AS ENUM ('user', 'system', 'external_reviewer');

-- CreateEnum
CREATE TYPE "AIFitTier" AS ENUM ('strong_match', 'partial_match', 'poor_match');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'team_member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "standingContentGuidelines" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Creator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "socialHandles" JSONB NOT NULL DEFAULT '{}',
    "instagramHandle" TEXT,
    "tiktokHandle" TEXT,
    "youtubeHandle" TEXT,
    "instagramFollowers" INTEGER,
    "tiktokFollowers" INTEGER,
    "youtubeFollowers" INTEGER,
    "instagramEngagementRate" DOUBLE PRECISION,
    "tiktokEngagementRate" DOUBLE PRECISION,
    "youtubeEngagementRate" DOUBLE PRECISION,
    "credibilityScore" DOUBLE PRECISION,
    "location" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "interests" JSONB NOT NULL DEFAULT '[]',
    "brandAffinities" JSONB NOT NULL DEFAULT '[]',
    "audienceDemographics" JSONB NOT NULL DEFAULT '{}',
    "exampleContent" JSONB NOT NULL DEFAULT '[]',
    "verticalTags" JSONB NOT NULL DEFAULT '[]',
    "dataProviderName" TEXT,
    "dataProviderExternalId" TEXT,
    "dataLastRefreshedAt" TIMESTAMP(3),
    "contentFlagged" BOOLEAN NOT NULL DEFAULT false,
    "contentFlagOverride" BOOLEAN,
    "globalEligibilityStatus" "GlobalEligibilityStatus" NOT NULL DEFAULT 'eligible_for_future_campaigns',
    "globalBlockReason" "GlobalBlockReason",
    "globalBlockNotes" TEXT,
    "blockedById" TEXT,
    "blockedAt" TIMESTAMP(3),
    "unblockedById" TEXT,
    "unblockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Creator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "product" TEXT,
    "platforms" JSONB NOT NULL DEFAULT '[]',
    "nicheKeywords" JSONB NOT NULL DEFAULT '[]',
    "targetCreatorLocations" JSONB NOT NULL DEFAULT '[]',
    "targetAudienceLocations" JSONB NOT NULL DEFAULT '[]',
    "audienceDemographics" JSONB NOT NULL DEFAULT '{}',
    "followerSizeMin" INTEGER,
    "followerSizeMax" INTEGER,
    "contentStyle" TEXT,
    "deliverables" TEXT,
    "defaultCompensationType" "CompensationType",
    "usageRightsExpectations" TEXT,
    "excludedContentTypes" JSONB NOT NULL DEFAULT '[]',
    "defaultAffiliateProgramId" TEXT,
    "clientFeedbackDisplaySettings" JSONB NOT NULL DEFAULT '{"showPricing": false}',
    "contentGuidelineTemplateId" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignCreator" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "workflowStatus" "WorkflowStatus" NOT NULL DEFAULT 'sourced',
    "campaignDecision" "CampaignDecision" NOT NULL DEFAULT 'keep_pending',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "declinedReason" TEXT,
    "aiFitScore" "AIFitTier",
    "aiFitExplanation" TEXT,
    "teamNotes" TEXT,
    "compensationType" "CompensationType" NOT NULL DEFAULT 'gifting_only',
    "flatFeeAmount" DECIMAL(12,2),
    "flatFeePaymentStatus" "FlatFeePaymentStatus",
    "usageRightsGranted" "UsageRightsGranted" NOT NULL DEFAULT 'negotiable',
    "usageRightsDuration" TEXT,
    "usageRightsFee" DECIMAL(12,2),
    "exclusivity" TEXT,
    "conversionRate" DOUBLE PRECISION,
    "gmv" DECIMAL(12,2),
    "sourcedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignCreator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPreference" (
    "id" TEXT NOT NULL,
    "campaignCreatorId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "reviewerEmail" TEXT,
    "preference" "ClientPreferenceValue" NOT NULL,
    "comment" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateProgram" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "network" "AffiliateNetwork" NOT NULL,
    "programName" TEXT NOT NULL,
    "externalProgramId" TEXT,
    "credentials" BYTEA,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateEnrollment" (
    "id" TEXT NOT NULL,
    "campaignCreatorId" TEXT NOT NULL,
    "network" "AffiliateNetwork" NOT NULL,
    "networkProgramId" TEXT,
    "enrollmentStatus" "AffiliateEnrollmentStatus" NOT NULL DEFAULT 'invite_created',
    "inviteLink" TEXT,
    "trackingLink" TEXT,
    "hubspotContactId" TEXT,
    "inviteEmailSentAt" TIMESTAMP(3),
    "inviteEmailStatus" "InviteEmailStatus",
    "appliedAt" TIMESTAMP(3),
    "enrolledAt" TIMESTAMP(3),
    "payoutStatus" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientFeedbackLink" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,

    CONSTRAINT "ClientFeedbackLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentGuidelineTemplate" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "name" TEXT NOT NULL,
    "rules" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentGuidelineTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "columnConfig" JSONB NOT NULL DEFAULT '[]',
    "sortConfig" JSONB NOT NULL DEFAULT '[]',
    "filterConfig" JSONB NOT NULL DEFAULT '{}',
    "pageScope" "SavedViewPageScope" NOT NULL,
    "campaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "actorType" "ActivityActorType" NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "action" TEXT NOT NULL,
    "detail" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Creator_globalEligibilityStatus_idx" ON "Creator"("globalEligibilityStatus");

-- CreateIndex
CREATE INDEX "Creator_contentFlagged_idx" ON "Creator"("contentFlagged");

-- CreateIndex
CREATE UNIQUE INDEX "Creator_dataProviderName_dataProviderExternalId_key" ON "Creator"("dataProviderName", "dataProviderExternalId");

-- CreateIndex
CREATE UNIQUE INDEX "Creator_instagramHandle_key" ON "Creator"("instagramHandle");

-- CreateIndex
CREATE UNIQUE INDEX "Creator_tiktokHandle_key" ON "Creator"("tiktokHandle");

-- CreateIndex
CREATE UNIQUE INDEX "Creator_youtubeHandle_key" ON "Creator"("youtubeHandle");

-- CreateIndex
CREATE INDEX "Campaign_clientId_idx" ON "Campaign"("clientId");

-- CreateIndex
CREATE INDEX "CampaignCreator_creatorId_idx" ON "CampaignCreator"("creatorId");

-- CreateIndex
CREATE INDEX "CampaignCreator_campaignId_workflowStatus_idx" ON "CampaignCreator"("campaignId", "workflowStatus");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignCreator_campaignId_creatorId_key" ON "CampaignCreator"("campaignId", "creatorId");

-- CreateIndex
CREATE INDEX "ClientPreference_campaignCreatorId_idx" ON "ClientPreference"("campaignCreatorId");

-- CreateIndex
CREATE INDEX "AffiliateProgram_clientId_idx" ON "AffiliateProgram"("clientId");

-- CreateIndex
CREATE INDEX "AffiliateEnrollment_campaignCreatorId_idx" ON "AffiliateEnrollment"("campaignCreatorId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientFeedbackLink_token_key" ON "ClientFeedbackLink"("token");

-- CreateIndex
CREATE INDEX "ClientFeedbackLink_campaignId_idx" ON "ClientFeedbackLink"("campaignId");

-- CreateIndex
CREATE INDEX "ContentGuidelineTemplate_clientId_idx" ON "ContentGuidelineTemplate"("clientId");

-- CreateIndex
CREATE INDEX "SavedView_userId_idx" ON "SavedView"("userId");

-- CreateIndex
CREATE INDEX "SavedView_campaignId_idx" ON "SavedView"("campaignId");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Creator" ADD CONSTRAINT "Creator_blockedById_fkey" FOREIGN KEY ("blockedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Creator" ADD CONSTRAINT "Creator_unblockedById_fkey" FOREIGN KEY ("unblockedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_defaultAffiliateProgramId_fkey" FOREIGN KEY ("defaultAffiliateProgramId") REFERENCES "AffiliateProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_contentGuidelineTemplateId_fkey" FOREIGN KEY ("contentGuidelineTemplateId") REFERENCES "ContentGuidelineTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignCreator" ADD CONSTRAINT "CampaignCreator_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignCreator" ADD CONSTRAINT "CampaignCreator_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPreference" ADD CONSTRAINT "ClientPreference_campaignCreatorId_fkey" FOREIGN KEY ("campaignCreatorId") REFERENCES "CampaignCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateProgram" ADD CONSTRAINT "AffiliateProgram_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateEnrollment" ADD CONSTRAINT "AffiliateEnrollment_campaignCreatorId_fkey" FOREIGN KEY ("campaignCreatorId") REFERENCES "CampaignCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientFeedbackLink" ADD CONSTRAINT "ClientFeedbackLink_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientFeedbackLink" ADD CONSTRAINT "ClientFeedbackLink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentGuidelineTemplate" ADD CONSTRAINT "ContentGuidelineTemplate_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedView" ADD CONSTRAINT "SavedView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedView" ADD CONSTRAINT "SavedView_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
