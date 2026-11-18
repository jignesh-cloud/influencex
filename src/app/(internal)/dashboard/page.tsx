import { getDashboardStats } from "@/features/dashboard/queries";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { RecentActivity } from "@/features/dashboard/components/recent-activity";
import { getClientsWithStats } from "@/features/clients/queries";
import { ClientDirectory } from "@/features/clients/components/client-directory";
import { getRecentActivity } from "@/services/activity-log/log-activity";

export default async function DashboardPage() {
  const [stats, clients, activity] = await Promise.all([
    getDashboardStats(),
    getClientsWithStats(),
    getRecentActivity(10),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500">Group 8A creator sourcing &amp; campaign overview.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Active campaigns" value={stats.activeCampaigns} />
        <StatCard label="Creators sourced this month" value={stats.creatorsSourcedThisMonth} />
        <StatCard label="Pending internal review" value={stats.pendingInternalReview} />
        <StatCard label="Awaiting client feedback" value={stats.awaitingClientFeedback} />
        <StatCard label="Affiliate enrollments pending" value={stats.affiliateEnrollmentsPending} />
        <StatCard label="Affiliate enrollments active" value={stats.affiliateEnrollmentsActive} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <h2 className="font-semibold text-neutral-900">Clients</h2>
          <ClientDirectory clients={clients} />
        </div>
        <RecentActivity entries={activity} />
      </div>
    </div>
  );
}
