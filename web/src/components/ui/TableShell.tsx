import type { ReactNode } from "react";
import {
  Box,
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
 * A visually-hidden label: present to screen readers, invisible on screen.
 * Used for an action column - a column with no visible heading because every
 * cell is a button. An empty `<th>` is flagged by axe (`empty-table-header`,
 * and `td-has-header`, which needs every data cell's column header to have
 * content), so an empty label still has to carry accessible text.
 */
const srOnly = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  border: 0,
} as const;

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
  columnAlign,
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
  /**
   * Per-column horizontal alignment, indexed to `headers`. Numeric columns
   * (counts, marks, percentages) align right; names and labels stay left. The
   * page sets the matching `align` on its own body cells.
   */
  columnAlign?: Array<"left" | "right" | undefined>;
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
            {headers.map((header, index) => (
              <TableCell key={header} align={columnAlign?.[index] === "right" ? "right" : undefined}>
                {header === "" ? (
                  <Box component="span" sx={srOnly}>
                    Actions
                  </Box>
                ) : (
                  header
                )}
              </TableCell>
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
