"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Button,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";

/** How a column's value is rendered, sorted and exported. */
export type DataTableColumnType = "text" | "number" | "percent" | "date";

export type DataTableColumn = {
  /** Key into each row object. Must match a key the server actually sends. */
  key: string;
  label: string;
  align?: "left" | "right";
  type?: DataTableColumnType;
};

export type DataTableRow = Record<string, string | number | null | undefined>;

type SortDirection = "asc" | "desc";

function displayValue(value: DataTableRow[string], type: DataTableColumnType): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  switch (type) {
    case "number":
      return typeof value === "number" ? value.toLocaleString() : String(value);
    case "percent":
      return `${value}%`;
    case "date":
      return new Date(String(value)).toLocaleDateString();
    default:
      return String(value);
  }
}

function compare(a: DataTableRow[string], b: DataTableRow[string], type: DataTableColumnType): number {
  if (type === "number" || type === "percent") {
    return (Number(a) || 0) - (Number(b) || 0);
  }

  return String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true });
}

/** RFC 4180 quoting: wrap in quotes and double any embedded quote. */
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function toCsv(columns: DataTableColumn[], rows: DataTableRow[]): string {
  const header = columns.map((column) => csvCell(column.label)).join(",");

  const body = rows.map((row) =>
    columns
      // Export the raw value, not the display value: a spreadsheet wants the
      // number, not "1,234" or "87.5%".
      .map((column) => csvCell(row[column.key] === null || row[column.key] === undefined ? "" : String(row[column.key])))
      .join(","),
  );

  return [header, ...body].join("\r\n");
}

/**
 * The dashboard's data table: sortable, filterable, paginated, exportable.
 *
 * It takes **flat rows and column descriptors**, not render callbacks. That is
 * not a limitation to work around — a Server Component cannot pass a function
 * to a Client Component, so a `render` prop would make this unusable from the
 * pages that need it. Formatting is therefore declared per column (`type`) and
 * applied here, and any value the page wants displayed differently is shaped
 * into the row object on the server.
 *
 * Filtering, sorting and paging are all in-memory over the rows the server
 * already fetched, so interacting with the table never issues a query and
 * never changes what RLS returned.
 */
export default function DataTable({
  rows,
  columns,
  csvName = "export",
  emptyMessage = "Nothing to show yet.",
  noMatchMessage = "Nothing matches your filter.",
  filterPlaceholder = "Filter rows…",
  initialSortKey,
  initialSortDirection = "asc",
  pageSize = 10,
  minWidth = 640,
}: {
  rows: DataTableRow[];
  columns: DataTableColumn[];
  /** Download filename without the `.csv` extension. */
  csvName?: string;
  emptyMessage?: string;
  noMatchMessage?: string;
  filterPlaceholder?: string;
  initialSortKey?: string;
  initialSortDirection?: SortDirection;
  pageSize?: number;
  minWidth?: number;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(initialSortKey ?? null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  const columnByKey = useMemo(
    () => new Map(columns.map((column) => [column.key, column])),
    [columns],
  );

  // Filter on the *displayed* text, so what a reader can see is what the filter
  // matches — searching "87.5%" finds a 87.5 percent cell.
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return rows;
    }

    return rows.filter((row) =>
      columns.some((column) =>
        displayValue(row[column.key], column.type ?? "text").toLowerCase().includes(needle),
      ),
    );
  }, [rows, columns, query]);

  const sorted = useMemo(() => {
    if (!sortKey) {
      return filtered;
    }

    const type = columnByKey.get(sortKey)?.type ?? "text";
    const factor = sortDirection === "asc" ? 1 : -1;

    // Copy first: `Array.prototype.sort` mutates, and `filtered` may be the
    // caller's own array when no filter is applied.
    return [...filtered].sort(
      (a, b) => compare(a[sortKey], b[sortKey], type) * factor,
    );
  }, [filtered, sortKey, sortDirection, columnByKey]);

  const visible = useMemo(
    () => sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sorted, page, rowsPerPage],
  );

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setPage(0);
  }

  function downloadCsv() {
    // Export everything that is currently in view, not just the visible page -
    // "export" that silently dropped rows would be worse than no export.
    const csv = toCsv(columns, sorted);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${csvName}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  const isFiltered = query.trim().length > 0;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <TextField
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
          placeholder={filterPlaceholder}
          size="small"
          fullWidth
          slotProps={{
            htmlInput: { "aria-label": filterPlaceholder },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ maxWidth: { xs: "100%", sm: 320 } }}
        />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {isFiltered || rows.length !== sorted.length ? (
            <Typography variant="caption" color="text.secondary">
              {sorted.length} of {rows.length}
            </Typography>
          ) : (
            <Typography variant="caption" color="text.secondary">
              {rows.length} row{rows.length === 1 ? "" : "s"}
            </Typography>
          )}

          <Button
            onClick={downloadCsv}
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon fontSize="small" />}
            disabled={sorted.length === 0}
          >
            CSV
          </Button>
        </Box>
      </Box>

      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ overflowX: "auto", borderRadius: "14px" }}
      >
        <Table size="small" sx={{ minWidth }}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align === "right" ? "right" : undefined}
                  sortDirection={sortKey === column.key ? sortDirection : false}
                  sx={{ whiteSpace: "nowrap" }}
                >
                  <TableSortLabel
                    active={sortKey === column.key}
                    direction={sortKey === column.key ? sortDirection : "asc"}
                    onClick={() => toggleSort(column.key)}
                  >
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    {noMatchMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              visible.map((row, rowIndex) => (
                <TableRow key={rowIndex} hover>
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      align={column.align === "right" ? "right" : undefined}
                      sx={
                        column.align === "right"
                          ? { fontVariantNumeric: "tabular-nums" }
                          : undefined
                      }
                    >
                      {displayValue(row[column.key], column.type ?? "text")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {sorted.length > 0 ? (
          <TablePagination
            component="div"
            count={sorted.length}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
            slotProps={{ select: { inputProps: { "aria-label": "Rows per page" } } }}
          />
        ) : null}
      </TableContainer>
    </Box>
  );
}
