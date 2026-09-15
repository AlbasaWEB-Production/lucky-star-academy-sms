"use client";

import type { ReactNode } from "react";
import { Box, Paper, Typography } from "@mui/material";

import SchoolLogo from "@/components/ui/SchoolLogo";

/**
 * Split-screen auth layout: form on the left, artwork on the right.
 *
 * Replaces the original LoginPage's inline CSS background, which pulled a
 * bundled image through styled-components.
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
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "minmax(380px, 5fr) 7fr" },
        minHeight: "100vh",
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
            borderRadius: 3,
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
          display: { xs: "none", md: "block" },
          backgroundImage: "url(/designlogin.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "secondary.main",
        }}
      />
    </Box>
  );
}
