import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

/** Centred placeholder for empty lists and unavailable records. */
export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Box sx={{ textAlign: "center", py: 6, px: 2 }}>
      <Typography variant="h6" sx={{ color: "secondary.main" }}>
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 460, mx: "auto" }}>
          {description}
        </Typography>
      ) : null}
      {action ? <Box sx={{ mt: 3 }}>{action}</Box> : null}
    </Box>
  );
}
