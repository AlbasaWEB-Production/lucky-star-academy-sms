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
 */
export default function TableShell({
  headers,
  children,
  emptyMessage = "Nothing to show yet.",
  isEmpty = false,
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
}) {
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ overflowX: "auto" }}>
      <Table size="medium" sx={{ minWidth: 640 }}>
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
