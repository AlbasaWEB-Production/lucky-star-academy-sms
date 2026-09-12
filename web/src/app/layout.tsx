import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";

import Providers from "./providers";
import "./globals.css";

/**
 * The `v16-appRouter` import path is matched to this project's Next.js major
 * version (16). `AppRouterCacheProvider` wires up Emotion's cache so that MUI
 * styles are collected during server rendering and streaming and emitted into
 * <head> rather than only landing in <body>, which avoids a flash of
 * unstyled content.
 */

export const metadata: Metadata = {
  title: {
    default: "Lucky Star Academy - School Management System",
    template: "%s | Lucky Star Academy SMS",
  },
  description:
    "Streamline school management, class organization, attendance tracking and communication between students, teachers and administrators.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
