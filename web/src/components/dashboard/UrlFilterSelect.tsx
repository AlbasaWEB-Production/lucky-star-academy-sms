"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TextField } from "@mui/material";

export type UrlFilterOption = {
  /** The value written to the URL. `""` means "no filter". */
  value: string;
  label: string;
};

/**
 * A dashboard filter that lives in the URL.
 *
 * The URL is the state, exactly as `SearchBar` does it for `?q=`: choosing an
 * option rewrites one query parameter and the server page re-renders with the
 * new `searchParams`. Nothing is filtered in the browser and no new parameter
 * is ever forwarded to Supabase — the page filters the rows RLS already
 * returned. That keeps the filter shareable, bookmarkable, and correct on a
 * full page load.
 *
 * **This component calls `useSearchParams()`**, so the page that mounts it must
 * have a `<Suspense>` boundary above it, or the whole route opts into client
 * rendering. Wrapping the selector alone is enough:
 *
 * ```tsx
 * <Suspense fallback={<Skeleton variant="rounded" height={40} width={180} />}>
 *   <TermSelector terms={terms} value={termId} />
 * </Suspense>
 * ```
 */
export default function UrlFilterSelect({
  name,
  label,
  value,
  options,
  allLabel = "All",
  disabled = false,
}: {
  /** Query parameter to write, e.g. `term`. */
  name: string;
  /** Visible field label. */
  label: string;
  /** Currently selected value, passed down from the server page. */
  value: string;
  /** Choices; the empty-valued one clears the filter. */
  options: UrlFilterOption[];
  /** Label for the "no filter" choice, when the options do not supply one. */
  allLabel?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(next: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (next) {
      params.set(name, next);
    } else {
      params.delete(name);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const hasEmptyOption = options.some((option) => option.value === "");

  return (
    <TextField
      select
      size="small"
      label={label}
      value={value}
      disabled={disabled || options.length === 0}
      onChange={(event) => select(event.target.value)}
      sx={{ minWidth: 180 }}
      // MUI's `select` renders a real <select>, so the label association and
      // keyboard behaviour come for free.
      slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
    >
      {hasEmptyOption ? null : <option value="">{allLabel}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </TextField>
  );
}
