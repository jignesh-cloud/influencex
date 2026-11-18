import {
  tableFeatures,
  columnVisibilityFeature,
  columnOrderingFeature,
  columnGroupingFeature,
  createGroupedRowModel,
  rowExpandingFeature,
  createExpandedRowModel,
  rowSortingFeature,
  createSortedRowModel,
  sortFn_alphanumeric,
  sortFn_text,
  columnFilteringFeature,
  globalFilteringFeature,
  createFilteredRowModel,
  filterFn_includesString,
} from "@tanstack/react-table";

/**
 * TanStack Table v9 registers every feature explicitly (nothing is bundled
 * by default, unlike v8). Defined once at module scope per the library's
 * own guidance — never recreate this inside a component.
 */
export const campaignTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  columnVisibilityFeature,
  columnOrderingFeature,
  columnGroupingFeature,
  rowExpandingFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  groupedRowModel: createGroupedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});
