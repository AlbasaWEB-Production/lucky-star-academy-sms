/**
 * Shared chart palette.
 *
 * Every chart in the product routes its series colours through this one
 * module so they read as a single family, derived from the green + gold
 * system in `src/theme.ts`. The first entry is the brand green used by the
 * existing single-series charts; subsequent entries are for multi-series
 * charts (people breakdown, question bars).
 */
export const CHART_COLORS = [
  "#147B45", // BRAND_GREEN - first series
  "#083E28", // BRAND_GREEN_DARK
  "#F2B705", // BRAND_GOLD
  "#3D9C6A", // mid green
  "#6B8F7A", // sage
];
