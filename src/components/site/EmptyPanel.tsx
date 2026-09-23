import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

/**
 * The honest empty state.
 *
 * Used where the school has not yet supplied something a visitor expects to
 * find — photographs, or the first news post. It says what will appear here and
 * how to get the information in the meantime, and it points at a real next step
 * (the office, usually).
 *
 * It is deliberately not a skeleton or a shimmer. A loading placeholder implies
 * content is on its way in milliseconds; this is a gap that lasts until the
 * school sends something, and it should read that way.
 */
export default function EmptyPanel({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  /** A link or button element rendered under the copy. */
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: "20px",
        backgroundColor: "background.paper",
        p: { xs: 3.5, md: 5 },
        textAlign: "center",
        maxWidth: 720,
        mx: "auto",
      }}
    >
      <Typography component="h3" variant="h6" sx={{ color: "secondary.main", mb: 1.5 }}>
        {title}
      </Typography>

      <Box sx={{ color: "text.secondary", "& p": { m: 0, mb: 1.5 }, "& p:last-of-type": { mb: 0 } }}>
        {children}
      </Box>

      {action ? <Box sx={{ mt: 3 }}>{action}</Box> : null}
    </Box>
  );
}
