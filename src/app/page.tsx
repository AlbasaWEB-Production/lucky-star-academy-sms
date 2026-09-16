import { Box } from "@mui/material";

import HomeNav from "@/components/home/HomeNav";
import HomeHero from "@/components/home/HomeHero";
import HomePortals from "@/components/home/HomePortals";
import ThisSchool from "@/components/home/ThisSchool";
import SiteFooter from "@/components/ui/SiteFooter";

export const metadata = {
  title: "Lucky Star Academy | School Management System",
};

/**
 * The landing page — a portal gateway, not a brochure.
 *
 * Four movements with no two adjacent sections sharing a ground: the saturated
 * green hero, a light portals band, a deep-green "this school" band, and the
 * deep-green footer. It stays a server component; the two pieces that need
 * browser APIs (the scroll-aware nav and the reveal wrapper) are client
 * components that take plain props.
 */
export default function HomePage() {
  return (
    <Box component="main" sx={{ backgroundColor: "background.default" }}>
      {/* Blocks wrapped in <Reveal> start hidden and are unhidden by an
          IntersectionObserver. With JavaScript off nothing would ever unhide
          them, so this restores the final state for that case. */}
      <noscript>
        <style>{`[data-reveal]{opacity:1 !important;transform:none !important;}`}</style>
      </noscript>

      <HomeNav />
      <HomeHero />
      <HomePortals />
      <ThisSchool />
      <SiteFooter variant="landing" />
    </Box>
  );
}
