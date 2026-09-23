import { Box, type SxProps, type Theme } from "@mui/material";

import type { Detail } from "@/content/site";

/**
 * Renders a `Detail` from `@/content/site`.
 *
 * A value the school has given us renders as ordinary text. A value still
 * outstanding renders marked: muted, italic, with a dashed underline and a
 * `data-pending` attribute.
 *
 * The marker is deliberately visible rather than decorative. The alternative —
 * quietly rendering a plausible-looking stand-in — is the failure mode
 * `DECISIONS.md` returns to again and again: a reader cannot tell an invented
 * value from a supplied one, so an unfinished site looks finished and a wrong
 * phone number looks right. A gap that announces itself is the safe default,
 * and it doubles as the client's to-do list while the content is being
 * gathered.
 *
 * The `note` on a pending detail says what the school must send. It is
 * deliberately **not** rendered: it is written for the client, not for a
 * visitor, and it lives in `PLACEHOLDERS.md` instead.
 */
export default function DetailText({
  detail,
  sx,
  /** Rendered instead of the marked placeholder when the value is known. */
  component = "span",
}: {
  detail: Detail;
  sx?: SxProps<Theme>;
  component?: "span" | "div" | "p";
}) {
  if (!detail.pending) {
    return (
      <Box component={component} sx={sx}>
        {detail.value}
      </Box>
    );
  }

  return (
    <Box
      component={component}
      data-pending="true"
      sx={[
        {
          // Colour is deliberately **inherited**, not set. This component is
          // used on white cards and on the deep-green bands alike, and a fixed
          // `text.secondary` here would render #6B6B6B on #083E28 — about
          // 1.6:1, unreadable. The marker is carried by the italics and the
          // dashed rule, which work on any ground.
          fontStyle: "italic",
          borderBottom: "1px dashed",
          borderColor: "currentColor",
          textDecoration: "none",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {detail.value}
    </Box>
  );
}

/**
 * A whole block of pending copy.
 *
 * Same contract as `DetailText`, but for the paragraph-length sections where a
 * dashed underline across several lines reads as a rendering fault rather than
 * a marker. Renders inside a bordered, muted panel so it is unmistakably
 * reserved space.
 */
export function PendingBlock({
  detail,
  fallback,
  sx,
}: {
  detail: Detail;
  /** Honest, already-true copy to show instead while the real text is missing. */
  fallback?: string;
  sx?: SxProps<Theme>;
}) {
  if (!detail.pending) {
    return (
      <Box sx={sx}>
        {detail.value.split("\n\n").map((paragraph) => (
          <Box component="p" key={paragraph} sx={{ m: 0, mb: 2, "&:last-of-type": { mb: 0 } }}>
            {paragraph}
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box
      data-pending="true"
      sx={[
        {
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: "14px",
          backgroundColor: "rgba(0, 0, 0, 0.015)",
          p: { xs: 2, sm: 3 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {fallback ? (
        <Box component="p" sx={{ m: 0, mb: 1.5 }}>
          {fallback}
        </Box>
      ) : null}

      <Box
        component="p"
        sx={{ m: 0, fontStyle: "italic", color: "text.secondary", opacity: 0.9 }}
      >
        {detail.value}
      </Box>
    </Box>
  );
}
