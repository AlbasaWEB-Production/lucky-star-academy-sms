import type { ReactNode } from "react";
import { Box, Paper, Skeleton, Typography } from "@mui/material";

/**
 * The dashboard's chart panel.
 *
 * Every chart on every dashboard is wrapped in the same shape the pages used to
 * hand-roll: an outlined `Paper` carrying a small overline category label above
 * an `h6` title. Factoring it out means the four states a data-backed panel can
 * be in — loading, error, empty, showing data — are handled the same way
 * everywhere, instead of each page inventing its own empty text.
 *
 * Deliberately a Server Component: it holds no state and attaches no handlers.
 * The optional `filter` and `action` slots take *rendered elements*, so a
 * server page can drop a client `TermSelector` into the filter slot without
 * this component needing to know it is interactive.
 *
 * Precedence is error → loading → empty → children. An error is never hidden
 * behind a skeleton, because a panel that failed should say so.
 */
export default function ChartCard({
  category,
  title,
  description,
  filter,
  action,
  loading = false,
  error = false,
  errorMessage = "This chart could not be loaded.",
  empty = false,
  emptyMessage = "Nothing to chart yet.",
  minHeight = 220,
  children,
}: {
  /** Small uppercase label above the title, e.g. `Attendance`, `Performance`. */
  category?: string;
  title: string;
  /** One line under the title saying what the chart measures, and over what period. */
  description?: string;
  /** Rendered top-right, beside the title — typically a `TermSelector`. */
  filter?: ReactNode;
  /** Rendered top-right — typically a link to the full page. */
  action?: ReactNode;
  loading?: boolean;
  error?: boolean;
  errorMessage?: string;
  empty?: boolean;
  emptyMessage?: string;
  /** Height reserved for the body, so panels in a row line up. */
  minHeight?: number;
  children?: ReactNode;
}) {
  // Derived from the title rather than `useId`, because a Server Component
  // cannot call hooks. Two panels with the same title on one page would clash,
  // so titles are kept distinct per page.
  const titleId = `chart-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  const hasFilterRow = Boolean(filter) || Boolean(action);

  return (
    <Paper
      component="section"
      variant="outlined"
      aria-labelledby={titleId}
      sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          {category ? (
            <Typography variant="overline" color="text.secondary" component="p" sx={{ lineHeight: 1.4 }}>
              {category}
            </Typography>
          ) : null}
          <Typography variant="h6" id={titleId} component="h2">
            {title}
          </Typography>
          {description ? (
            <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          ) : null}
        </Box>

        {hasFilterRow ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
            {filter}
            {action}
          </Box>
        ) : null}
      </Box>

      <Box sx={{ flex: 1, minHeight }}>
        {error ? (
          <Box sx={{ display: "grid", placeItems: "center", height: minHeight, px: 2 }}>
            <Typography variant="body2" color="error" sx={{ textAlign: "center" }}>
              {errorMessage}
            </Typography>
          </Box>
        ) : loading ? (
          <ChartCardSkeleton />
        ) : empty ? (
          <Box sx={{ display: "grid", placeItems: "center", height: minHeight, px: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
              {emptyMessage}
            </Typography>
          </Box>
        ) : (
          children
        )}
      </Box>
    </Paper>
  );
}

/**
 * The loading placeholder, sized like the content it stands in for so the page
 * does not jump when the data arrives. `aria-hidden` because a screen reader
 * should hear the panel's title, not four anonymous grey bars.
 */
export function ChartCardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Box aria-hidden sx={{ display: "grid", gap: 1.5, alignItems: "end", height: "100%" }}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton
          key={index}
          variant="rounded"
          height={index === 0 ? 36 : 24}
          width={`${100 - index * 12}%`}
        />
      ))}
    </Box>
  );
}
