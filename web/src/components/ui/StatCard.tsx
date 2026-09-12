import type { ReactNode } from "react";
import { Box, Paper, Typography } from "@mui/material";

/** Compact metric tile used by the dashboards. */
export default function StatCard({
  label,
  value,
  hint,
  icon,
  accent = "primary.main",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        display: "flex",
        alignItems: "center",
        gap: 2,
        borderLeft: "4px solid",
        borderLeftColor: accent,
        height: "100%",
      }}
    >
      {icon ? (
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            width: 44,
            height: 44,
            borderRadius: "50%",
            backgroundColor: "action.hover",
            color: accent,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      ) : null}

      <Box sx={{ minWidth: 0 }}>
        <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2 }}>
          {label}
        </Typography>
        <Typography variant="h5" sx={{ lineHeight: 1.3 }}>
          {value}
        </Typography>
        {hint ? (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        ) : null}
      </Box>
    </Paper>
  );
}
