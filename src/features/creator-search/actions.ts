"use server";

import { requireUser } from "@/lib/auth";
import { upsertCreatorFromProviderRecord } from "@/services/creator-provider/ingest-creator";
import { CREATOR_PROVIDER_NAME, type CreatorProviderRecord } from "@/services/creator-provider";
import { addCreatorToCampaign } from "@/features/creators/actions";

export async function addSearchResultToCampaign(campaignId: string, record: CreatorProviderRecord) {
  await requireUser();
  const creator = await upsertCreatorFromProviderRecord(CREATOR_PROVIDER_NAME, record);
  return addCreatorToCampaign(creator.id, campaignId);
}
