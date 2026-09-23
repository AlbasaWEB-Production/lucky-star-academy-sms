"use client";

import { usePathname, useRouter } from "next/navigation";
import { TextField } from "@mui/material";

/**
 * The class filter above the week grid.
 *
 * The URL is the state, exactly as `SearchBar` does it for `?q=`: choosing a
 * class rewrites `?class=` and the server page re-renders with the new
 * `searchParams`, so the view is shareable and correct on a full page load.
 * Nothing is filtered in the browser, and no new parameter is forwarded to
 * Supabase - the page filters the rows RLS already returned.
 *
 * The current value arrives as a prop rather than from `useSearchParams()`, for
 * the reason PAGE-CONVENTIONS gives: a hook read of the query string forces the
 * whole route through a `<Suspense>` boundary, and the server page already has
 * the value. `?class=` is the only parameter this page carries, so rewriting
 * the query string here loses nothing.
 */

/**
 * The explicit "every class" choice.
 *
 * A class id is a uuid, so `all` can never collide with one - which is what
 * lets an *absent* parameter keep a different meaning: open the first class,
 * because the whole-school grid is the view this filter exists to narrow.
 */
export const ALL_CLASSES = "all";

export default function ClassFilterSelect({
  classes,
  value,
  label = "Class",
}: {
  classes: { id: string; name: string }[];
  /** `ALL_CLASSES` or a class id. */
  value: string;
  label?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function select(next: string) {
    router.replace(`${pathname}?class=${encodeURIComponent(next)}`, { scroll: false });
  }

  return (
    <TextField
      select
      size="small"
      label={label}
      value={value}
      disabled={classes.length === 0}
      onChange={(event) => select(event.target.value)}
      sx={{ width: { xs: "100%", sm: 240 } }}
      // MUI's `select` renders a real <select>, so label association, keyboard
      // behaviour and the 360px form factor all come for free.
      slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
    >
      <option value={ALL_CLASSES}>All classes</option>
      {classes.map((classroom) => (
        <option key={classroom.id} value={classroom.id}>
          {classroom.name}
        </option>
      ))}
    </TextField>
  );
}
