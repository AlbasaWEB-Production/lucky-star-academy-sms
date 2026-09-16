import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";

import Providers from "./providers";
import "./globals.css";

/**
 * The school's two typefaces, loaded once and self-hosted at build (no browser
 * requests to Google). Fraunces is the display/identity serif; Hanken Grotesk
 * carries the body and labels. Each exposes a CSS variable consumed by the MUI
 * theme, so a single class on <html> switches the whole app.
 *
 * Fraunces is a variable font. SOFT is turned up for a warmer, more "printed"
 * serif; WONK stays off so the letterforms stay steady and legible.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  axes: ["SOFT", "WONK"],
  variable: "--font-fraunces",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-hanken",
  display: "swap",
});

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
  // The favicon, icon, and apple-icon are the school crest derived from
  // `public/lucky_star_logo.png` and served as `favicon.ico`, `icon.png`, and
  // `apple-icon.png` in this `app/` directory via the App Router file
  // conventions, so no explicit `icons` metadata is needed here.
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${hanken.variable}`}>
      <body>
        <AppRouterCacheProvider>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
