"use client";

import type { ReactNode } from "react";
import { alpha, Box, Paper, Typography, useTheme, type Theme } from "@mui/material";
import { BRAND_GOLD } from "@/theme";

export type StatCardTone = "primary" | "deepGreen" | "gold" | "neutral" | "warning" | "error";

/** Map a semantic tone to the concrete colour it stands for, from the theme. */
function toneColor(theme: Theme, tone: StatCardTone): string {
  switch (tone) {
    case "primary":
      return theme.palette.primary.main;
    case "deepGreen":
      return theme.palette.secondary.main;
    case "gold":
      return BRAND_GOLD;
    case "neutral":
      return theme.palette.text.secondary;
    case "warning":
      return theme.palette.warning.main;
    case "error":
      return theme.palette.error.main;
  }
}

/**
 * Metric tile for the dashboards.
 *
 * A quiet card — small uppercase label, large serif number, small
 * rounded-square icon chip and a fine hairline rule — deliberately different
 * from the role/notice cards. One tile per dashboard can be marked `primary`
 * to become the filled-green focal point; the rest stay quiet and outlined.
 * Colour is tokenised: `tone` picks a semantic accent, never a raw hex.
 */
export default function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "primary",
  primary = false,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: StatCardTone;
  primary?: boolean;
}) {
  const theme = useTheme();
  const accent = toneColor(theme, tone);

  return (
    <Paper
      variant={primary ? "elevation" : "outlined"}
      elevation={0}
      sx={{
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        borderRadius: "14px",
        height: "100%",
        ...(primary
          ? { backgroundColor: "primary.main", color: "#ffffff", border: "none" }
          : { borderColor: "divider" }),
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography
          variant="overline"
          noWrap
          sx={{
            lineHeight: 1.2,
            ...(primary ? { color: "rgba(255, 255, 255, 0.85)" } : { color: "text.secondary" }),
          }}
        >
          {label}
        </Typography>

        {icon ? (
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              width: 36,
              height: 36,
              borderRadius: "10px",
              flexShrink: 0,
              ...(primary
                ? { bgcolor: "rgba(255, 255, 255, 0.16)", color: "#ffffff" }
                : { bgcolor: alpha(accent, 0.12), color: accent }),
            }}
          >
            {icon}
          </Box>
        ) : null}
      </Box>

      <Box
        sx={{
          height: 1,
          width: "100%",
          backgroundColor: primary ? "rgba(255, 255, 255, 0.25)" : "divider",
        }}
      />

      <Typography
        variant="h4"
        sx={{
          lineHeight: 1.1,
          ...(primary ? { color: "#ffffff" } : { color: "text.primary" }),
        }}
      >
        {value}
      </Typography>

      {hint ? (
        <Typography
          variant="caption"
          sx={primary ? { color: "rgba(255, 255, 255, 0.8)" } : { color: "text.secondary" }}
        >
          {hint}
        </Typography>
      ) : null}
    </Paper>
  );
}
