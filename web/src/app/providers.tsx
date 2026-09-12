"use client";

import type { ReactNode } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";

import theme from "@/theme";

/**
 * Client-side providers for the whole app.
 *
 * MUI components are client components (they still server-render, but they are
 * not React Server Components), so the theme provider has to live inside a
 * client boundary. Keeping it in one place means the rest of the tree can
 * stay server-rendered.
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
