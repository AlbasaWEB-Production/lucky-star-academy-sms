"use client";

import type { ReactNode } from "react";
import { Box, Paper, Typography } from "@mui/material";

import SchoolLogo from "@/components/ui/SchoolLogo";
import SiteFooter from "@/components/ui/SiteFooter";
import { BRAND_GOLD, BRAND_GREEN_DARK, PAGE_BG } from "@/theme";

/**
 * Split-screen auth layout: form on the left, deep-green brand rail on the right.
 *
 * The right panel is the school's own brand moment — the crest, the school name
 * in Fraunces and one line in the school's own words, over the deep green, with
 * a faint gold "Lucky Star" star watermark. No borrowed orb. Hidden on mobile.
 *
 * The outer box is a column flex so the footer sits below the split screen and
 * never pushes the sign-in card off a phone screen.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "background.default",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(380px, 5fr) 7fr" },
          flex: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 3, sm: 6 },
          }}
        >
          <Paper
            component="main"
            elevation={0}
            sx={{
              width: "100%",
              maxWidth: 420,
              p: { xs: 3, sm: 4 },
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "24px",
            }}
          >
            <SchoolLogo priority sizes="80px" sx={{ height: 64, mb: 2.5 }} />

            <Typography variant="h5" sx={{ mb: 0.5, color: "secondary.main" }}>
              {title}
            </Typography>

            {subtitle ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {subtitle}
              </Typography>
            ) : (
              <Box sx={{ mb: 3 }} />
            )}

            {children}

            {footer ? <Box sx={{ mt: 3 }}>{footer}</Box> : null}
          </Paper>
        </Box>

        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            p: { md: 6, lg: 8 },
            backgroundColor: BRAND_GREEN_DARK,
          }}
        >
          {/* Faint gold star watermark, low enough contrast to stay calm. */}
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: "10%",
              right: "12%",
              width: 200,
              height: 200,
              color: BRAND_GOLD,
              opacity: 0.1,
              pointerEvents: "none",
            }}
          >
            <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.9 6.26 6.9.7-5.15 4.6 1.45 6.74L12 16.9 5.9 20.3l1.45-6.74L2.2 8.96l6.9-.7z" />
            </svg>
          </Box>

          <SchoolLogo
            decorative
            sizes="160px"
            sx={{ height: 96, mb: 3, position: "relative", zIndex: 1 }}
          />

          <Typography
            variant="h3"
            sx={{ mb: 2, color: PAGE_BG, position: "relative", zIndex: 1 }}
          >
            Lucky Star Academy, Yendi
          </Typography>

          <Typography
            variant="body1"
            sx={{ color: PAGE_BG, opacity: 0.82, maxWidth: 380, position: "relative", zIndex: 1 }}
          >
            One place for our office, teachers and families to share attendance,
            results and notices.
          </Typography>
        </Box>
      </Box>

      <SiteFooter />
    </Box>
  );
}
