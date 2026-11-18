"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FOLLOWER_TIERS } from "@/services/creator-provider/types";

export function CreatorSearchForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("similarTo");
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  const activeTier = searchParams.get("tier");

  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Keyword…"
          defaultValue={searchParams.get("keyword") ?? ""}
          onChange={(e) => updateParams({ keyword: e.target.value || null })}
          className="max-w-[200px]"
        />
        <Input
          placeholder="Niche / vertical"
          defaultValue={searchParams.get("vertical") ?? ""}
          onChange={(e) => updateParams({ vertical: e.target.value || null })}
          className="max-w-[180px]"
        />
        <Select
          value={searchParams.get("platform") ?? "all"}
          onValueChange={(v) => updateParams({ platform: v === "all" || !v ? null : v })}
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
          placeholder="Creator location"
          defaultValue={searchParams.get("location") ?? ""}
          onChange={(e) => updateParams({ location: e.target.value || null })}
          className="max-w-[160px]"
        />
        <Input
          placeholder="Audience location"
          defaultValue={searchParams.get("audienceLocation") ?? ""}
          onChange={(e) => updateParams({ audienceLocation: e.target.value || null })}
          className="max-w-[160px]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-neutral-500">Tier:</span>
        {Object.entries(FOLLOWER_TIERS).map(([key, tier]) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={activeTier === key ? "default" : "outline"}
            onClick={() =>
              updateParams({
                tier: key,
                followerMin: String(tier.min),
                followerMax: tier.max ? String(tier.max) : null,
              })
            }
          >
            {tier.label}
          </Button>
        ))}
        {activeTier ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => updateParams({ tier: null, followerMin: null, followerMax: null })}
          >
            Clear tier
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="number"
          placeholder="Min followers (custom)"
          defaultValue={searchParams.get("followerMin") ?? ""}
          onChange={(e) => updateParams({ tier: null, followerMin: e.target.value || null })}
          className="max-w-[180px]"
        />
        <Input
          type="number"
          placeholder="Max followers (custom)"
          defaultValue={searchParams.get("followerMax") ?? ""}
          onChange={(e) => updateParams({ tier: null, followerMax: e.target.value || null })}
          className="max-w-[180px]"
        />
        <Input
          type="number"
          placeholder="Min engagement %"
          defaultValue={searchParams.get("engagementRateMin") ?? ""}
          onChange={(e) => updateParams({ engagementRateMin: e.target.value || null })}
          className="max-w-[160px]"
        />
        <Input
          type="number"
          placeholder="Min age"
          defaultValue={searchParams.get("ageMin") ?? ""}
          onChange={(e) => updateParams({ ageMin: e.target.value || null })}
          className="max-w-[110px]"
        />
        <Input
          type="number"
          placeholder="Max age"
          defaultValue={searchParams.get("ageMax") ?? ""}
          onChange={(e) => updateParams({ ageMax: e.target.value || null })}
          className="max-w-[110px]"
        />
        <Input
          placeholder="Gender"
          defaultValue={searchParams.get("gender") ?? ""}
          onChange={(e) => updateParams({ gender: e.target.value || null })}
          className="max-w-[120px]"
        />
      </div>
    </div>
  );
}
