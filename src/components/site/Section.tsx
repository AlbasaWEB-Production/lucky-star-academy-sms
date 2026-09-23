import type { ReactNode } from "react";
import { Box, Container, Typography } from "@mui/material";

import { BRAND_GOLD, HERO_GREEN, ON_GREEN } from "@/theme";

/**
 * A page section, and the heading block that opens it.
 *
 * Every public page is a stack of these. The `tone` decides the ground, and the
 * rule the rest of this codebase follows applies here too: no two adjacent
 * sections share a ground, so the page has a rhythm instead of one long scroll
 * of the same colour.
 *
 * `gs-section` on the wrapper is not decoration — it is the anchor the
 * "alternating ground" rule can be checked against in a rendered page.
 */

export type SectionTone = "default" | "paper" | "green";

const TONE: Record<SectionTone, { backgroundColor: string; grain: boolean }> = {
  /** The warm off-white page ground. */
  default: { backgroundColor: "background.default", grain: false },
  /** White, for a panel that should lift off the page ground. */
  paper: { backgroundColor: "background.paper", grain: false },
  /** The deep saturated green, for a band that should stop the scroll. */
  green: { backgroundColor: HERO_GREEN, grain: true },
};

export default function Section({
  children,
  tone = "default",
  id,
  labelledBy,
  size = "normal",
  maxWidth = "lg",
}: {
  children: ReactNode;
  tone?: SectionTone;
  id?: string;
  /** The id of this section's heading, when it has one. */
  labelledBy?: string;
  size?: "normal" | "compact";
  maxWidth?: "lg" | "md";
}) {
  const { backgroundColor, grain } = TONE[tone];

  return (
    <Box
      component="section"
      id={id}
      aria-labelledby={labelledBy}
      className={grain ? "grain" : undefined}
      data-gs-section={tone}
      sx={{
        position: "relative",
        backgroundColor,
        py: size === "compact" ? { xs: 6, md: 8 } : { xs: 8, md: 11 },
      }}
    >
      <Container maxWidth={maxWidth} sx={{ position: "relative", zIndex: 1 }}>
        {children}
      </Container>
    </Box>
  );
}

/**
 * The heading block at the top of a section: an optional gold-dashed kicker, a
 * Fraunces title, and a lead line.
 *
 * `onGreen` flips the palette for the deep-green bands. It is a prop rather
 * than something inferred, because a section can be green while a card inside
 * it is white, and guessing from context is how contrast bugs get introduced.
 */
export function SectionHeading({
  id,
  overline,
  title,
  lead,
  onGreen = false,
  align = "left",
}: {
  id?: string;
  overline?: string;
  title: string;
  lead?: string;
  onGreen?: boolean;
  align?: "left" | "center";
}) {
  return (
    <Box
      sx={{
        mb: { xs: 5, md: 6 },
        maxWidth: align === "center" ? 720 : 760,
        mx: align === "center" ? "auto" : undefined,
        textAlign: align,
      }}
    >
      {overline ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 1.5,
            justifyContent: align === "center" ? "center" : "flex-start",
          }}
        >
          <Box
            aria-hidden
            sx={{ width: 28, height: 3, backgroundColor: BRAND_GOLD, borderRadius: 999 }}
          />
          <Typography variant="overline" sx={{ color: onGreen ? BRAND_GOLD : "text.secondary" }}>
            {overline}
          </Typography>
        </Box>
      ) : null}

      <Typography
        id={id}
        variant="h2"
        sx={{
          color: onGreen ? "#FFFFFF" : "secondary.main",
          mb: lead ? 2 : 0,
          fontSize: { xs: "1.625rem", md: "2rem" },
        }}
      >
        {title}
      </Typography>

      {lead ? (
        <Typography
          variant="body1"
          sx={{ color: onGreen ? ON_GREEN : "text.secondary", fontSize: "1.0625rem" }}
        >
          {lead}
        </Typography>
      ) : null}
    </Box>
  );
}
