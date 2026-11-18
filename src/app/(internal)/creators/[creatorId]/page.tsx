import Link from "next/link";
import { notFound } from "next/navigation";
import { getCreatorProfile, getCampaignOptionsForCreator } from "@/features/creators/queries";
import { deriveClientFeedbackSummary, CLIENT_FEEDBACK_LABELS } from "@/features/campaign-creators/client-feedback";
import { formatFollowers, formatPercent, formatCurrency } from "@/features/campaign-creators/table/format";
import { AddToCampaignDialog } from "@/features/creators/components/add-to-campaign-dialog";
import { GlobalEligibilityControl } from "@/features/creators/components/global-eligibility-control";
import { CampaignHistoryFavoriteToggle } from "@/features/creators/components/campaign-history-favorite-toggle";
import { RefreshCreatorButton } from "@/features/creators/components/refresh-creator-button";
import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DECISION_LABELS: Record<string, string> = {
  accept_for_campaign: "Accept for This Campaign",
  decline_for_campaign: "Decline for This Campaign",
  keep_pending: "Keep Pending",
};

export default async function CreatorProfilePage({
  params,
}: PageProps<"/creators/[creatorId]">) {
  const { creatorId } = await params;
  const [profile, user] = await Promise.all([getCreatorProfile(creatorId), requireUser()]);

  if (!profile) {
    notFound();
  }

  const { creator, campaignHistory } = profile;
  const campaigns = await getCampaignOptionsForCreator(creatorId);
  const openCampaigns = campaigns.filter((c) => !c.alreadyAdded);
  const isBlocked = creator.globalEligibilityStatus === "unfit_globally_blocked";

  const platformStats = (
    [
      ["Instagram", creator.instagramHandle, creator.instagramFollowers, creator.instagramEngagementRate],
      ["TikTok", creator.tiktokHandle, creator.tiktokFollowers, creator.tiktokEngagementRate],
      ["YouTube", creator.youtubeHandle, creator.youtubeFollowers, creator.youtubeEngagementRate],
    ] as const
  ).filter(([, handle]) => handle !== null);

  const interests = Array.isArray(creator.interests) ? (creator.interests as string[]) : [];
  const brandAffinities = Array.isArray(creator.brandAffinities) ? (creator.brandAffinities as string[]) : [];
  const exampleContent = Array.isArray(creator.exampleContent) ? (creator.exampleContent as unknown[]) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{creator.name}</h1>
          <p className="text-sm text-neutral-500">
            {creator.email ?? "No email on file"}
            {creator.location ? ` · ${creator.location}` : ""}
            {creator.dataLastRefreshedAt ? ` · Data refreshed ${creator.dataLastRefreshedAt.toLocaleDateString()}` : ""}
          </p>
          <div className="mt-2 flex items-center gap-2">
            {isBlocked ? (
              <Badge className="bg-red-100 text-red-800">Unfit for Any Brand</Badge>
            ) : (
              <Badge variant="secondary">Eligible for Future Campaigns</Badge>
            )}
            {creator.credibilityScore !== null ? (
              <Badge variant="outline">Credibility {creator.credibilityScore}</Badge>
            ) : null}
          </div>
          {isBlocked ? (
            <div className="mt-2 text-sm text-red-700">
              <p className="font-medium">{creator.globalBlockReason}</p>
              {creator.globalBlockNotes ? <p className="text-neutral-600">{creator.globalBlockNotes}</p> : null}
              <p className="text-xs text-neutral-500">
                Blocked by {creator.blockedBy?.name ?? "—"}
                {creator.blockedAt ? ` on ${creator.blockedAt.toLocaleDateString()}` : ""}
              </p>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <RefreshCreatorButton creatorId={creator.id} hasProvider={!!creator.dataProviderExternalId} />
          <GlobalEligibilityControl creatorId={creator.id} isBlocked={isBlocked} isAdmin={user.role === "admin"} />
          <AddToCampaignDialog
            creatorId={creator.id}
            campaigns={openCampaigns}
            disabled={isBlocked}
            disabledReason="Unblock this creator before adding them to a campaign."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 font-semibold text-neutral-900">Platforms</h2>
          {platformStats.length === 0 ? (
            <p className="text-sm text-neutral-500">No platform data on file.</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {platformStats.map(([label, handle, followers, engagement]) => (
                <div key={label}>
                  <p className="text-sm font-medium text-neutral-900">{label}</p>
                  <p className="text-xs text-neutral-500">@{handle}</p>
                  <p className="mt-1 text-lg font-semibold">{formatFollowers(followers)}</p>
                  <p className="text-xs text-neutral-500">{formatPercent(engagement)} engagement</p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4">
            <div>
              <p className="text-xs text-neutral-500">Average likes</p>
              <p className="font-medium">{creator.averageLikes ? formatFollowers(creator.averageLikes) : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Average views</p>
              <p className="font-medium">{creator.averageViews ? formatFollowers(creator.averageViews) : "—"}</p>
            </div>
          </div>
        </Card>

        <Card className="space-y-3 p-5">
          <div>
            <p className="text-xs text-neutral-500">Age / Gender</p>
            <p className="text-sm">
              {creator.age ?? "—"} / {creator.gender ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Interests</p>
            <p className="text-sm">{interests.length > 0 ? interests.join(", ") : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Brand affinities</p>
            <p className="text-sm">{brandAffinities.length > 0 ? brandAffinities.join(", ") : "—"}</p>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 font-semibold text-neutral-900">Recent content</h2>
        {exampleContent.length === 0 ? (
          <p className="text-sm text-neutral-500">No content on file.</p>
        ) : (
          <p className="text-sm text-neutral-600">{exampleContent.length} item(s) on file.</p>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 font-semibold text-neutral-900">Campaign history</h2>
        {campaignHistory.length === 0 ? (
          <p className="text-sm text-neutral-500">Not sourced for any campaign yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-left text-neutral-600">
              <tr>
                <th className="py-2 pr-3">Client</th>
                <th className="py-2 pr-3">Campaign</th>
                <th className="py-2 pr-3">Client Feedback</th>
                <th className="py-2 pr-3">Group 8A Decision</th>
                <th className="py-2 pr-3">Decline Reason</th>
                <th className="py-2 pr-3">Performance</th>
                <th className="py-2 pr-3">Favorite</th>
              </tr>
            </thead>
            <tbody>
              {campaignHistory.map((entry) => {
                const summary = deriveClientFeedbackSummary(entry.clientPreferences);
                return (
                  <tr key={entry.id} className="border-b border-neutral-100">
                    <td className="py-2 pr-3">
                      <Link href={`/clients/${entry.campaign.client.id}`} className="hover:underline">
                        {entry.campaign.client.name}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">
                      <Link href={`/campaigns/${entry.campaign.id}`} className="hover:underline">
                        {entry.campaign.name}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">{CLIENT_FEEDBACK_LABELS[summary]}</td>
                    <td className="py-2 pr-3">{DECISION_LABELS[entry.campaignDecision]}</td>
                    <td className="py-2 pr-3">{entry.declinedReason ?? "—"}</td>
                    <td className="py-2 pr-3">
                      {entry.conversionRate !== null || entry.gmv !== null
                        ? `${formatPercent(entry.conversionRate)} · ${formatCurrency(
                            entry.gmv ? Number(entry.gmv) : null,
                          )}`
                        : "—"}
                    </td>
                    <td className="py-2 pr-3">
                      <CampaignHistoryFavoriteToggle campaignCreatorId={entry.id} favorite={entry.favorite} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
