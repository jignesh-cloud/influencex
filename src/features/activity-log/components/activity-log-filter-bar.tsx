"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ActivityLogFilterBar({ entityTypes }: { entityTypes: string[] }) {
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

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Search action or actor…"
        defaultValue={searchParams.get("search") ?? ""}
        onChange={(e) => updateParam("search", e.target.value || null)}
        className="max-w-xs"
      />
      <Select
        value={searchParams.get("entityType") ?? "all"}
        onValueChange={(v) => updateParam("entityType", v === "all" ? null : v)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All entity types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All entity types</SelectItem>
          {entityTypes.map((type) => (
            <SelectItem key={type} value={type} className="capitalize">
              {type.replaceAll("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
