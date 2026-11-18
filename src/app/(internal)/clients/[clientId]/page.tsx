import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientById } from "@/features/clients/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  completed: "Completed",
};

export default async function ClientWorkspacePage({
  params,
}: PageProps<"/clients/[clientId]">) {
  const { clientId } = await params;
  const client = await getClientById(clientId);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{client.name}</h1>
          {client.contactName || client.contactEmail ? (
            <p className="mt-1 text-sm text-neutral-500">
              {client.contactName}
              {client.contactName && client.contactEmail ? " · " : ""}
              {client.contactEmail}
            </p>
          ) : null}
        </div>
        <Button nativeButton={false} render={<Link href={`/clients/${client.id}/campaigns/new`} />}>
          Create Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 font-semibold text-neutral-900">Campaigns</h2>
          {client.campaigns.length === 0 ? (
            <p className="text-sm text-neutral-500">No campaigns yet for this client.</p>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {client.campaigns.map((campaign) => (
                <li key={campaign.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-neutral-900">{campaign.name}</p>
                    <p className="text-sm text-neutral-500">
                      {campaign._count.campaignCreators} creator
                      {campaign._count.campaignCreators === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                      {STATUS_LABEL[campaign.status] ?? campaign.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/campaigns/${campaign.id}`} />}
                    >
                      View Campaign
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-3 font-semibold text-neutral-900">Connected affiliate networks</h2>
            {client.affiliatePrograms.length === 0 ? (
              <p className="text-sm text-neutral-500">No affiliate programs configured.</p>
            ) : (
              <ul className="space-y-2">
                {client.affiliatePrograms.map((program) => (
                  <li key={program.id} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-neutral-700">{program.network}</span>
                    <Badge variant={program.active ? "default" : "secondary"}>
                      {program.active ? "Active" : "Inactive"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-semibold text-neutral-900">Standing content guidelines</h2>
            <p className="whitespace-pre-wrap text-sm text-neutral-600">
              {client.standingContentGuidelines || "None on file."}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
