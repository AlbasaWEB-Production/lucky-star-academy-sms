import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

import { BRAND_GREEN, BRAND_GREEN_DARK } from "@/theme";

/**
 * The public site's one content card.
 *
 * Follows the card rules already fixed in `DESIGN.md`: a tinted **rounded
 * square** icon chip rather than the icon-in-a-circle motif, a 20px radius (the
 * "framed surface" step of the radius scale), and a hairline rather than a
 * shadow. One card component for highlights, values and admission steps keeps
 * the site coherent — the same reasoning that took `HomePortals` and
 * `ThisSchool` out of the old landing page.
 *
 * Server-safe: it takes an icon *element* as a child, never a component
 * reference, so nothing has to cross the server/client boundary as a function.
 */
export default function Card({
  title,
  body,
  icon,
  index,
  children,
}: {
  title: string;
  body?: string;
  /** A rendered MUI icon element, e.g. `<StarsOutlined />`. */
  icon?: ReactNode;
  /** Optional numeral shown instead of an icon, e.g. an admission step number. */
  index?: number;
  children?: ReactNode;
}) {
  return (
    <Box
      sx={{
        height: "100%",
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "20px",
        p: { xs: 3, md: 3.5 },
        display: "flex",
        flexDirection: "column",
      }}
    >
      {typeof index === "number" ? (
        <Box
          aria-hidden
          sx={{
            width: 38,
            height: 38,
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            backgroundColor: BRAND_GREEN,
            color: "#FFFFFF",
            fontWeight: 700,
            fontSize: "0.9375rem",
            mb: 2.5,
          }}
        >
          {String(index).padStart(2, "0")}
        </Box>
      ) : icon ? (
        <Box
          aria-hidden
          sx={{
            width: 42,
            height: 42,
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            backgroundColor: "rgba(20, 123, 69, 0.10)",
            color: BRAND_GREEN_DARK,
            mb: 2.5,
            "& svg": { fontSize: 22 },
          }}
        >
          {icon}
        </Box>
      ) : null}

      <Typography
        component="h3"
        variant="h6"
        sx={{ color: "secondary.main", mb: body || children ? 1.25 : 0, fontSize: "1.0625rem" }}
      >
        {title}
      </Typography>

      {body ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {body}
        </Typography>
      ) : null}

      {children}
    </Box>
  );
}
