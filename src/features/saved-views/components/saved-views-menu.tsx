"use client";

import { useState, useTransition } from "react";
import { Bookmark, Trash2 } from "lucide-react";
import { createSavedView, deleteSavedView } from "@/features/saved-views/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { SavedViewPageScope } from "@/generated/prisma/enums";

export interface SavedViewData {
  id: string;
  name: string;
  pageScope: SavedViewPageScope;
  columnConfig: unknown;
  sortConfig: unknown;
  filterConfig: unknown;
}

export function SavedViewsMenu({
  views,
  pageScope,
  campaignId,
  getCurrentConfig,
  onApply,
}: {
  views: SavedViewData[];
  pageScope: SavedViewPageScope;
  campaignId?: string;
  getCurrentConfig: () => { columnConfig: Record<string, unknown>; sortConfig: unknown[]; filterConfig: Record<string, unknown> };
  onApply: (view: SavedViewData) => void;
}) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");
  const [scope, setScope] = useState<SavedViewPageScope>(pageScope);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const config = getCurrentConfig();
    startTransition(async () => {
      await createSavedView({
        name,
        pageScope: scope,
        campaignId,
        columnConfig: config.columnConfig,
        sortConfig: config.sortConfig as { id: string; desc: boolean }[],
        filterConfig: config.filterConfig,
      });
      setSaveOpen(false);
      setName("");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
          <Bookmark className="mr-1.5" size={14} />
          Saved Views
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>Your saved views</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {views.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-neutral-500">No saved views yet.</p>
          ) : (
            views.map((view) => (
              <div key={view.id} className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm">
                <button type="button" className="flex-1 truncate text-left hover:underline" onClick={() => onApply(view)}>
                  {view.name}
                </button>
                <button
                  type="button"
                  aria-label="Delete saved view"
                  className="text-neutral-400 hover:text-red-600"
                  onClick={() => startTransition(() => deleteSavedView(view.id))}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogTrigger render={<Button variant="outline" size="sm" />}>Save Current View</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save view</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="View name" value={name} onChange={(e) => setName(e.target.value)} />
            {pageScope === "campaign_dashboard" && campaignId ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={scope === "all_campaign_dashboards"}
                  onChange={(e) => setScope(e.target.checked ? "all_campaign_dashboards" : "campaign_dashboard")}
                />
                Apply to all campaign dashboards, not just this one
              </label>
            ) : null}
          </div>
          <DialogFooter>
            <Button disabled={!name || isPending} onClick={handleSave}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
