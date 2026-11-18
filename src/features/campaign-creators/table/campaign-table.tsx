"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Download, Settings2 } from "lucide-react";
import { useTable } from "@tanstack/react-table";
import { campaignTableFeatures } from "@/features/campaign-creators/table/table-features";
import { buildColumns, DEFAULT_VISIBLE_COLUMNS, WORKFLOW_STATUS_LABELS } from "@/features/campaign-creators/table/columns";
import { downloadCsv, columnCsvValue } from "@/features/campaign-creators/table/csv-export";
import { ClientFeedbackSheet } from "@/features/campaign-creators/components/client-feedback-sheet";
import { SavedViewsMenu, type SavedViewData } from "@/features/saved-views/components/saved-views-menu";
import type { CampaignCreatorRow } from "@/features/campaign-creators/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function buildInitialVisibility(allColumnIds: string[]) {
  const visibility: Record<string, boolean> = {};
  for (const id of allColumnIds) {
    visibility[id] = DEFAULT_VISIBLE_COLUMNS.includes(id);
  }
  return visibility;
}

interface AffiliateProgramOption {
  id: string;
  network: string;
  programName: string;
}

export function CampaignTable({
  campaignId,
  campaignName,
  rows,
  affiliatePrograms,
  savedViews,
}: {
  campaignId: string;
  campaignName: string;
  rows: CampaignCreatorRow[];
  affiliatePrograms: AffiliateProgramOption[];
  savedViews: SavedViewData[];
}) {
  const [feedbackRow, setFeedbackRow] = useState<CampaignCreatorRow | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(
    () => buildColumns(setFeedbackRow, campaignId, affiliatePrograms),
    [campaignId, affiliatePrograms],
  );
  const initialColumnVisibility = useMemo(
    () => buildInitialVisibility(columns.map((c) => c.id as string)),
    [columns],
  );

  const table = useTable(
    {
      features: campaignTableFeatures,
      columns,
      data: rows,
      globalFilterFn: "includesString",
      getColumnCanGlobalFilter: (column) => column.id === "creatorName",
      initialState: {
        columnVisibility: initialColumnVisibility,
        grouping: ["workflowStatus"],
        expanded: true,
        columnOrder: columns.map((c) => c.id as string),
      },
      state: { globalFilter },
      onGlobalFilterChange: setGlobalFilter,
      groupedColumnMode: false,
    },
    (state) => ({
      columnVisibility: state.columnVisibility,
      columnOrder: state.columnOrder,
      sorting: state.sorting,
      grouping: state.grouping,
      expanded: state.expanded,
    }),
  );

  function handleExportCsv() {
    const visibleColumns = table.getVisibleLeafColumns().filter((c) => c.id !== "favorite");
    const headers = visibleColumns.map((c) => (typeof c.columnDef.header === "string" ? c.columnDef.header : c.id));
    const leafRows = table
      .getFilteredRowModel()
      .rows.filter((row) => !row.getIsGrouped())
      .map((row) => visibleColumns.map((c) => columnCsvValue(row.original, c.id)));
    downloadCsv(`${campaignName.replace(/\s+/g, "-").toLowerCase()}-creators.csv`, headers, leafRows);
  }

  const orderableColumns = table.getAllLeafColumns().filter((c) => c.id !== "favorite");

  function getCurrentConfig() {
    return {
      columnConfig: { visibility: table.state.columnVisibility, order: table.state.columnOrder },
      sortConfig: table.state.sorting,
      filterConfig: { globalFilter },
    };
  }

  function applyView(view: SavedViewData) {
    const columnConfig = view.columnConfig as { visibility?: Record<string, boolean>; order?: string[] } | null;
    const sortConfig = view.sortConfig as { id: string; desc: boolean }[] | null;
    const filterConfig = view.filterConfig as { globalFilter?: string } | null;

    if (columnConfig?.visibility) table.setColumnVisibility(columnConfig.visibility);
    if (columnConfig?.order) table.setColumnOrder(columnConfig.order);
    if (sortConfig) table.setSorting(sortConfig);
    setGlobalFilter(filterConfig?.globalFilter ?? "");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Input
          placeholder="Search creators…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <Settings2 className="mr-1.5" size={14} />
              Columns
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-96 w-72 overflow-y-auto">
              <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {orderableColumns.map((column, index) => (
                <div key={column.id} className="flex items-center gap-2 px-2 py-1.5 text-sm">
                  <Checkbox
                    checked={column.getIsVisible()}
                    disabled={!column.getCanHide()}
                    onCheckedChange={(checked) => column.toggleVisibility(!!checked)}
                  />
                  <span className="flex-1 truncate">
                    {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
                  </span>
                  <button
                    type="button"
                    disabled={index === 0}
                    aria-label="Move column left"
                    className="text-neutral-400 hover:text-neutral-900 disabled:opacity-30"
                    onClick={() => {
                      const order = table.state.columnOrder.slice();
                      const from = order.indexOf(column.id);
                      [order[from - 1], order[from]] = [order[from], order[from - 1]];
                      table.setColumnOrder(order);
                    }}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    disabled={index === orderableColumns.length - 1}
                    aria-label="Move column right"
                    className="text-neutral-400 hover:text-neutral-900 disabled:opacity-30"
                    onClick={() => {
                      const order = table.state.columnOrder.slice();
                      const from = order.indexOf(column.id);
                      [order[from + 1], order[from]] = [order[from], order[from + 1]];
                      table.setColumnOrder(order);
                    }}
                  >
                    →
                  </button>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="mr-1.5" size={14} />
            Export CSV
          </Button>
          <SavedViewsMenu
            views={savedViews}
            pageScope="campaign_dashboard"
            campaignId={campaignId}
            getCurrentConfig={getCurrentConfig}
            onApply={applyView}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="whitespace-nowrap px-3 py-2 text-left font-medium text-neutral-600">
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className="flex items-center gap-1 disabled:cursor-default"
                        disabled={!header.column.getCanSort()}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <table.FlexRender header={header} />
                        {header.column.getIsSorted() === "asc" ? "▲" : header.column.getIsSorted() === "desc" ? "▼" : ""}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              if (row.getIsGrouped()) {
                const statusValue = row.getValue("workflowStatus") as string;
                return (
                  <tr key={row.id} className="border-b border-neutral-200 bg-neutral-50">
                    <td colSpan={row.getAllCells().length} className="px-3 py-2">
                      <button
                        type="button"
                        onClick={row.getToggleExpandedHandler()}
                        className="flex items-center gap-2 font-medium text-neutral-800"
                      >
                        {row.getIsExpanded() ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {WORKFLOW_STATUS_LABELS[statusValue as keyof typeof WORKFLOW_STATUS_LABELS] ?? statusValue}
                        <span className="font-normal text-neutral-400">({row.subRows.length})</span>
                      </button>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={row.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-3 py-2">
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-12 text-center text-neutral-500">No creators sourced for this campaign yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <ClientFeedbackSheet row={feedbackRow} onOpenChange={(open) => !open && setFeedbackRow(null)} />
    </div>
  );
}
