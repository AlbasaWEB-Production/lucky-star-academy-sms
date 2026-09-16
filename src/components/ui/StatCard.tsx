"use client";

import type { ReactNode } from "react";
import { alpha, Box, Paper, Typography, useTheme, type Theme } from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { BRAND_GOLD } from "@/theme";

export type StatCardTone = "primary" | "deepGreen" | "gold" | "neutral" | "warning" | "error";

/**
 * A change against a previous period, shown under the metric.
 *
 * `direction` says which way the number moved; `positive` says whether that
 * movement is *good*, which is not the same thing — a falling absence rate
 * moves down and is good news. When `positive` is omitted it defaults to
 * `direction === "up"`.
 *
 * Direction is never carried by colour alone: each state pairs its colour with
 * an arrow icon and the `label` text, so the meaning survives greyscale and a
 * screen reader.
 */
export type StatCardTrend = {
  /** The change itself, e.g. `+4.2 pts`, `−3 pupils`. */
  value: string;
  direction: "up" | "down" | "flat";
  /** Whether this movement is good news. Defaults to `direction === "up"`. */
  positive?: boolean;
  /** What the change is measured against, e.g. `vs last term`. */
  label?: string;
};

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
  trend,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: StatCardTone;
  primary?: boolean;
  trend?: StatCardTrend;
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
        {/* Text on the green fill is solid white, never a softened alpha. A
            0.85 white composites over `primary.main` (#147b45) to #dcebe3,
            which is 4.31:1 — under AA — and 0.8 lands at 4.02:1. Solid white
            is 5.32:1. The hierarchy is carried by weight and size instead;
            only the non-text decoration (the rule, the icon chip) stays
            translucent, where contrast minimums do not apply. */}
        <Typography
          variant="overline"
          noWrap
          sx={{
            lineHeight: 1.2,
            ...(primary ? { color: "#ffffff" } : { color: "text.secondary" }),
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

      {/* A metric value is not a heading. Without `component="div"` the theme's
          variant mapping would render the biggest number on the page as an `h2`,
          putting a spurious heading between the card titles. */}
      <Typography
        variant="h4"
        component="div"
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
          sx={primary ? { color: "#ffffff" } : { color: "text.secondary" }}
        >
          {hint}
        </Typography>
      ) : null}

      {trend ? <StatCardTrendRow trend={trend} primary={primary} /> : null}
    </Paper>
  );
}

/**
 * The delta line. Extracted so the icon choice and the accessible text are
 * written once: a screen reader hears "Improving, +4.2 pts vs last term"
 * rather than an arrow glyph with no name.
 */
function StatCardTrendRow({ trend, primary }: { trend: StatCardTrend; primary: boolean }) {
  const theme = useTheme();
  const isGood = trend.positive ?? trend.direction === "up";

  const Icon =
    trend.direction === "up" ? TrendingUpIcon : trend.direction === "down" ? TrendingDownIcon : TrendingFlatIcon;

  const directionWord =
    trend.direction === "up" ? "Rising" : trend.direction === "down" ? "Falling" : "Unchanged";

  const goodColor = theme.palette.success.dark;
  const badColor = theme.palette.error.dark;
  const colour = primary
    ? "rgba(255, 255, 255, 0.92)"
    : trend.direction === "flat"
      ? theme.palette.text.secondary
      : isGood
        ? goodColor
        : badColor;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: "auto", pt: 0.5 }}>
      <Icon sx={{ fontSize: 18, color: colour }} aria-hidden />
      <Typography variant="caption" sx={{ color: colour, fontWeight: 600 }}>
        <Box component="span" sx={visuallyHidden}>
          {`${directionWord}, `}
        </Box>
        {trend.value}
      </Typography>
      {trend.label ? (
        <Typography
          variant="caption"
          sx={primary ? { color: "#ffffff" } : { color: "text.secondary" }}
        >
          {trend.label}
        </Typography>
      ) : null}
    </Box>
  );
}
