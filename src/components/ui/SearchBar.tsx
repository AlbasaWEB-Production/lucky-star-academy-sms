"use client";

import { useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, IconButton, InputAdornment, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

const DEBOUNCE_MS = 350;

/**
 * Filter box for a list page.
 *
 * The page stays a Server Component: it reads `?q=` from `searchParams`,
 * filters the already-fetched rows in memory, and passes the current value in as
 * `initialQuery`. This client component owns the only interactive part - it
 * writes `?q=` to the URL (debounced as you type, immediately on Enter) and
 * clears back to the bare path when the field is emptied. It never re-syncs
 * from `initialQuery`, because its own navigation is the only thing that moves
 * it.
 */
export default function SearchBar({
  placeholder,
  initialQuery = "",
}: {
  placeholder: string;
  initialQuery?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [value, setValue] = useState(initialQuery);

  // The last query we actually sent, so a keystroke that returns to the same
  // value does not push a redundant URL (which would add a history entry and
  // re-render the server page for nothing).
  const lastSent = useRef(initialQuery.trim());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const navigate = (next: string) => {
    clearTimer();
    const trimmed = next.trim();
    if (trimmed === lastSent.current) return;
    lastSent.current = trimmed;
    router.replace(trimmed ? `${pathname}?q=${encodeURIComponent(trimmed)}` : pathname, {
      scroll: false,
    });
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setValue(next);
    clearTimer();
    timer.current = setTimeout(() => navigate(next), DEBOUNCE_MS);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    navigate(value);
  };

  const handleClear = () => {
    setValue("");
    navigate("");
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3, maxWidth: 480, minHeight: 56 }}>
      <TextField
        name="q"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        size="small"
        fullWidth
        autoComplete="off"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: value ? (
              <InputAdornment position="end">
                <IconButton aria-label="Clear search" onClick={handleClear} edge="end" size="small">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          },
        }}
      />
    </Box>
  );
}
