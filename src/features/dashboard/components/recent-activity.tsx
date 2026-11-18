import { Card } from "@/components/ui/card";
import { describeActivity, timeAgo } from "@/features/activity-log/format";
import type { getRecentActivity } from "@/services/activity-log/log-activity";

export function RecentActivity({
  entries,
}: {
  entries: Awaited<ReturnType<typeof getRecentActivity>>;
}) {
  return (
    <Card className="p-5">
      <h2 className="mb-3 font-semibold text-neutral-900">Recent activity</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-neutral-500">No activity yet.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-start justify-between gap-4 text-sm">
              <span className="text-neutral-700">{describeActivity(entry.action, entry.detail)}</span>
              <span className="shrink-0 text-neutral-400">{timeAgo(entry.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
