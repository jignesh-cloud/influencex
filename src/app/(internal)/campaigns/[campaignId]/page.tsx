import Link from "next/link";
import { notFound } from "next/navigation";
import { getCampaignForDashboard } from "@/features/campaigns/queries";
import { CampaignTable } from "@/features/campaign-creators/table/campaign-table";
import { getFeedbackLinksForCampaign } from "@/features/feedback/queries";
import { FeedbackLinkManager } from "@/features/feedback/components/feedback-link-manager";
import { getSavedViewsForUser } from "@/features/saved-views/queries";
import { requireUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  completed: "Completed",
};

export default async function CampaignDashboardPage({
  params,
}: PageProps<"/campaigns/[campaignId]">) {
  const { campaignId } = await params;
  const campaign = await getCampaignForDashboard(campaignId);

  if (!campaign) {
    notFound();
  }

  const { activeLink } = await getFeedbackLinksForCampaign(campaignId);
  const baseUrl = env.FEEDBACK_LINK_BASE_URL ?? env.NEXTAUTH_URL ?? "http://localhost:3000";
  const user = await requireUser();
  const savedViews = await getSavedViewsForUser(user.id, "campaign_dashboard", campaignId);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/clients/${campaign.client.id}`} className="text-sm text-neutral-500 hover:underline">
          {campaign.client.name}
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-neutral-900">{campaign.name}</h1>
            <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
              {STATUS_LABEL[campaign.status] ?? campaign.status}
            </Badge>
          </div>
          <Button nativeButton={false} render={<Link href={`/campaigns/${campaign.id}/search`} />}>
            Find Creators
          </Button>
        </div>
      </div>

      <FeedbackLinkManager campaignId={campaign.id} activeLink={activeLink} baseUrl={baseUrl} />

      <CampaignTable
        campaignId={campaign.id}
        campaignName={campaign.name}
        rows={campaign.rows}
        affiliatePrograms={campaign.client.affiliatePrograms}
        savedViews={savedViews}
      />
    </div>
  );
}
