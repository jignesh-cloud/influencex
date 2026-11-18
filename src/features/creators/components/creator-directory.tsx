"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddToCampaignDialog } from "@/features/creators/components/add-to-campaign-dialog";
import { formatPercent } from "@/features/campaign-creators/table/format";
import { SavedViewsMenu, type SavedViewData } from "@/features/saved-views/components/saved-views-menu";
import type { CreatorDirectoryItem } from "@/features/creators/queries";

interface CampaignOption {
  id: string;
  name: string;
  client: { name: string };
}

export function CreatorDirectory({
  creators,
  campaigns,
  clients,
  isAdmin,
  savedViews,
}: {
  creators: CreatorDirectoryItem[];
  campaigns: CampaignOption[];
  clients: { id: string; name: string }[];
  isAdmin: boolean;
  savedViews: SavedViewData[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  function getCurrentConfig() {
    const filterConfig: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      filterConfig[key] = value;
    });
    return { columnConfig: {}, sortConfig: [], filterConfig };
  }

  function applyView(view: SavedViewData) {
    const filterConfig = (view.filterConfig ?? {}) as Record<string, string>;
    const params = new URLSearchParams(filterConfig);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name or handle…"
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => updateParam("search", e.target.value || null)}
          className="max-w-xs"
        />
        <Select
          value={searchParams.get("platform") ?? "all"}
          onValueChange={(v) => updateParam("platform", v === "all" ? null : v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Vertical (e.g. wellness)"
          defaultValue={searchParams.get("vertical") ?? ""}
          onChange={(e) => updateParam("vertical", e.target.value || null)}
          className="max-w-[220px]"
        />
        <Select
          value={searchParams.get("clientId") ?? "all"}
          onValueChange={(v) => updateParam("clientId", v === "all" ? null : v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Clients worked with" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any client</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isAdmin ? (
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <Checkbox
              checked={searchParams.get("showBlocked") === "1"}
              onCheckedChange={(checked) => updateParam("showBlocked", checked ? "1" : null)}
            />
            Show Blocked Creators
          </label>
        ) : null}
        <SavedViewsMenu
          views={savedViews}
          pageScope="creator_directory"
          getCurrentConfig={getCurrentConfig}
          onApply={applyView}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-neutral-600">Creator</th>
              <th className="px-3 py-2 text-left font-medium text-neutral-600">Vertical</th>
              <th className="px-3 py-2 text-left font-medium text-neutral-600">Engagement</th>
              <th className="px-3 py-2 text-left font-medium text-neutral-600">Conversion Rate</th>
              <th className="px-3 py-2 text-left font-medium text-neutral-600">Global Eligibility</th>
              <th className="px-3 py-2 text-left font-medium text-neutral-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {creators.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-12 text-center text-neutral-500">
                  No creators match your filters.
                </td>
              </tr>
            ) : (
              creators.map((creator) => {
                const isBlocked = creator.globalEligibilityStatus === "unfit_globally_blocked";
                return (
                  <tr key={creator.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="px-3 py-2">
                      <Link href={`/creators/${creator.id}`} className="font-medium text-neutral-900 hover:underline">
                        {creator.name}
                      </Link>
                      {isBlocked ? (
                        <div className="mt-1">
                          <Badge className="bg-red-100 text-red-800">Blocked</Badge>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-neutral-600">{creator.verticalTags || "—"}</td>
                    <td className="px-3 py-2">{formatPercent(creator.engagementRate)}</td>
                    <td className="px-3 py-2">{formatPercent(creator.bestConversionRate)}</td>
                    <td className="px-3 py-2">
                      {isBlocked ? (
                        <div className="text-xs text-neutral-500">
                          <p className="font-medium text-red-700">{creator.globalBlockReason}</p>
                          <p>
                            Blocked by {creator.blockedByName ?? "—"}
                            {creator.blockedAt ? ` on ${creator.blockedAt.toLocaleDateString()}` : ""}
                          </p>
                        </div>
                      ) : (
                        <Badge variant="secondary">Eligible</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/creators/${creator.id}`} />}>
                          View Profile
                        </Button>
                        <AddToCampaignDialog
                          creatorId={creator.id}
                          campaigns={campaigns}
                          disabled={isBlocked}
                          disabledReason="Unblock this creator before adding them to a campaign."
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
