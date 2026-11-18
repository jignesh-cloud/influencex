import { getContentGuidelineTemplates } from "@/features/settings/content-guidelines/queries";
import { ContentGuidelineManager } from "@/features/settings/content-guidelines/components/content-guideline-manager";
import { prisma } from "@/db/prisma";

export default async function SettingsContentGuidelinesPage() {
  const [templates, clients] = await Promise.all([
    getContentGuidelineTemplates(),
    prisma.client.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return <ContentGuidelineManager templates={templates} clients={clients} />;
}
