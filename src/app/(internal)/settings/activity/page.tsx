import { getActivityLog, getDistinctEntityTypes } from "@/services/activity-log/log-activity";
import { ActivityLogFilterBar } from "@/features/activity-log/components/activity-log-filter-bar";
import { describeActivity } from "@/features/activity-log/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SettingsActivityPage({
  searchParams,
}: PageProps<"/settings/activity">) {
  const sp = await searchParams;
  const entityType = typeof sp.entityType === "string" ? sp.entityType : undefined;
  const search = typeof sp.search === "string" ? sp.search : undefined;

  const [entries, entityTypes] = await Promise.all([
    getActivityLog({ entityType, search }),
    getDistinctEntityTypes(),
  ]);

  return (
    <div className="space-y-4">
      <ActivityLogFilterBar entityTypes={entityTypes} />

      <Card className="p-0">
        {entries.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-500">No activity matches these filters.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="capitalize">
                    {entry.entityType.replaceAll("_", " ")}
                  </Badge>
                  <span className="text-neutral-700">{describeActivity(entry.action, entry.detail)}</span>
                </div>
                <div className="shrink-0 text-right text-xs text-neutral-400">
                  <p>{entry.actorName ?? entry.actorType}</p>
                  <p>{entry.createdAt.toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
