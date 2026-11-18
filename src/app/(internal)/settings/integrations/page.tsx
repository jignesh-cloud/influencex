import { getAffiliatePrograms, getIntegrationModes } from "@/features/settings/integrations/queries";
import { IntegrationManager } from "@/features/settings/integrations/components/integration-manager";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/db/prisma";

export default async function SettingsIntegrationsPage() {
  const [programs, clients, user] = await Promise.all([
    getAffiliatePrograms(),
    prisma.client.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    requireUser(),
  ]);

  return (
    <IntegrationManager
      modes={getIntegrationModes()}
      programs={programs}
      clients={clients}
      isAdmin={user.role === "admin"}
    />
  );
}
