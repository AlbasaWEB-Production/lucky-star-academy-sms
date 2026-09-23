import { Box, Button, Container, Typography } from "@mui/material";

import Link from "@/components/NextLink";
import { portalHref } from "@/lib/site/host";
import { SITE_NAV } from "@/lib/site/routes";
import { BRAND_GOLD, BRAND_GREEN_DARK, HERO_GREEN, ON_GREEN } from "@/theme";

/**
 * The "page not found" screen.
 *
 * Rendered from two places, and both are needed:
 *
 *   - `src/app/(site)/not-found.tsx`, for a page inside the website that calls
 *     `notFound()`.
 *   - `src/app/not-found.tsx`, for a URL that matches no route at all — which
 *     is the common case, since a mistyped address has no group context, so a
 *     `not-found.tsx` inside the `(site)` route group is never reached.
 *
 * It is self-contained on purpose: the root rendering sits in the root layout
 * and therefore has none of the website's chrome, so this brings its own
 * heading and its own way out.
 *
 * It lists the real pages rather than apologising at length — someone who
 * mistyped an address wants the list of what does exist.
 */
export default function SiteNotFound() {
  return (
    <Box
      className="grain"
      sx={{
        position: "relative",
        backgroundColor: HERO_GREEN,
        pt: { xs: 12, md: 16 },
        pb: { xs: 10, md: 13 },
        minHeight: "72vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ maxWidth: 660 }}>
          <Box
            aria-hidden
            sx={{ width: 32, height: 3, backgroundColor: BRAND_GOLD, borderRadius: 999, mb: 2.5 }}
          />

          <Typography variant="overline" sx={{ color: BRAND_GOLD }}>
            Page not found
          </Typography>

          <Typography
            variant="h1"
            sx={{ color: "#FFFFFF", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", mt: 1, mb: 2 }}
          >
            We could not find that page
          </Typography>

          <Typography variant="body1" sx={{ color: ON_GREEN, mb: 4 }}>
            The address may be mistyped, or the page may have moved. Here is everything on the
            school&rsquo;s website:
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 4 }}>
            {SITE_NAV.map((item) => (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                variant="outlined"
                size="small"
                sx={{
                  color: "#FFFFFF",
                  borderColor: "rgba(244, 241, 232, 0.45)",
                  "&:hover": {
                    borderColor: "#FFFFFF",
                    backgroundColor: "rgba(255,255,255,0.10)",
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <Button
              component={Link}
              href="/"
              variant="contained"
              sx={{
                backgroundColor: BRAND_GOLD,
                color: BRAND_GREEN_DARK,
                "&:hover": { backgroundColor: "#E0A800" },
              }}
            >
              Back to the home page
            </Button>

            <Link
              href={portalHref("/login")}
              style={{
                color: ON_GREEN,
                fontWeight: 600,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Looking for the portal? Sign in here
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
