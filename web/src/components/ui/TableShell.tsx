import type { ReactNode } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

/**
 * Presentational table wrapper.
 *
 * Deliberately not a generic component with per-column render callbacks: a
 * Server Component cannot pass functions to a Client Component, and a column
 * `render` prop would be exactly that. Pages therefore pass the body rows as
 * `children` elements, which is allowed, and each page keeps control of how
 * its cells are rendered.
 *
 * `density` switches between the compact rows a staff member scans and the
 * roomier rows a pupil reads; `minWidth` lets a small pupil surface avoid a
 * needlessly wide table. Row alignment (names left, numbers right) and
 * whole-row links stay with the page, which renders the cells.
 */
export default function TableShell({
  headers,
  children,
  emptyMessage = "Nothing to show yet.",
  isEmpty = false,
  density = "comfortable",
  minWidth = 640,
}: {
  headers: string[];
  children?: ReactNode;
  emptyMessage?: string;
  /**
   * Passed explicitly rather than inferred from `children`. An empty array is
   * truthy in JavaScript, so `students.map(...)` producing [] would otherwise
   * render a header row above nothing at all.
   */
  isEmpty?: boolean;
  /** "compact" for staff data tables, "comfortable" for pupil-facing surfaces. */
  density?: "compact" | "comfortable";
  /** Minimum table width; keep this small for pupil-facing tables. */
  minWidth?: number;
}) {
  const compact = density === "compact";

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ overflowX: "auto", borderRadius: "14px" }}
    >
      <Table size={compact ? "small" : "medium"} sx={{ minWidth }}>
        <TableHead>
          <TableRow>
            {headers.map((header) => (
              <TableCell key={header}>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {isEmpty ? (
            <TableRow>
              <TableCell colSpan={headers.length} sx={{ py: 6, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            children
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
