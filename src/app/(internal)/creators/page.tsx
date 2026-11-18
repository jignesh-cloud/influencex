import { getCreatorsDirectory } from "@/features/creators/queries";
import { CreatorDirectory } from "@/features/creators/components/creator-directory";
import { getSavedViewsForUser } from "@/features/saved-views/queries";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth";

export default async function CreatorsPage({
  searchParams,
}: PageProps<"/creators">) {
  const params = await searchParams;
  const user = await requireUser();

  const search = typeof params.search === "string" ? params.search : undefined;
  const platform =
    params.platform === "instagram" || params.platform === "tiktok" || params.platform === "youtube"
      ? params.platform
      : undefined;
  const vertical = typeof params.vertical === "string" ? params.vertical : undefined;
  const clientId = typeof params.clientId === "string" ? params.clientId : undefined;
  const showBlocked = user.role === "admin" && params.showBlocked === "1";

  const [creators, campaigns, clients, savedViews] = await Promise.all([
    getCreatorsDirectory({ search, platform, vertical, clientId, showBlocked }),
    prisma.campaign.findMany({
      where: { status: { not: "completed" } },
      select: { id: true, name: true, client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    getSavedViewsForUser(user.id, "creator_directory"),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Creators</h1>
      <CreatorDirectory
        creators={creators}
        campaigns={campaigns}
        clients={clients}
        isAdmin={user.role === "admin"}
        savedViews={savedViews}
      />
    </div>
  );
}
