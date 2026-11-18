import { notFound } from "next/navigation";
import { getClientForCampaignBuilder } from "@/features/campaigns/queries";
import { CampaignBuilderForm } from "@/features/campaigns/components/campaign-builder-form";

export default async function NewCampaignPage({
  params,
}: PageProps<"/clients/[clientId]/campaigns/new">) {
  const { clientId } = await params;
  const client = await getClientForCampaignBuilder(clientId);

  if (!client) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm text-neutral-500">{client.name}</p>
        <h1 className="text-2xl font-semibold text-neutral-900">New campaign</h1>
      </div>
      <CampaignBuilderForm
        clientId={client.id}
        affiliatePrograms={client.affiliatePrograms}
        contentGuidelineTemplates={client.contentGuidelineTemplates}
      />
    </div>
  );
}
