import { Box, Container, Typography } from "@mui/material";

import Reveal from "@/components/home/Reveal";
import SchoolLogo from "@/components/ui/SchoolLogo";
import { BRAND_GOLD, HERO_GREEN, ON_GREEN } from "@/theme";

/**
 * The "this school" band: one short, honest statement of whose system this is.
 *
 * Every fact here is already true in the data — the school's name, Yendi and the
 * Northern Region, Primary 1-6, and the two campuses (`classes.campus`). No
 * statistics, no testimonials, nothing invented. The motto and founding year
 * were left blank, so neither appears as text here (the banner's crest carries
 * both as artwork, which is where the school put them).
 *
 * A full-bleed deep-green band, so it shares no background with the light
 * portals band above it.
 */
const CAMPUSES = ["Nayilifong", "Kpatuya"];

export default function ThisSchool() {
  return (
    <Box
      component="section"
      className="grain"
      aria-labelledby="home-school-heading"
      sx={{
        position: "relative",
        backgroundColor: HERO_GREEN,
        py: { xs: 9, md: 12 },
      }}
    >
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Reveal>
          <Box
            sx={{
              display: "grid",
              gap: { xs: 4, md: 6 },
              alignItems: "center",
              gridTemplateColumns: { xs: "1fr", md: "auto 1fr" },
            }}
          >
            <SchoolLogo
              decorative
              sizes="160px"
              sx={{
                height: { xs: 104, md: 148 },
                justifySelf: { xs: "start", md: "center" },
              }}
            />

            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <Box
                  aria-hidden
                  sx={{ width: 28, height: 3, backgroundColor: BRAND_GOLD, borderRadius: 999 }}
                />
                <Typography variant="overline" sx={{ color: ON_GREEN }}>
                  This school
                </Typography>
              </Box>

              <Typography
                id="home-school-heading"
                variant="h2"
                sx={{ color: "#FFFFFF", mb: 2 }}
              >
                Lucky Star Academy, Yendi
              </Typography>

              <Typography
                variant="body1"
                sx={{ color: ON_GREEN, maxWidth: 620, mb: 4 }}
              >
                A Primary 1&ndash;6 school in the Northern Region of Ghana. This system is how our
                office, teachers and families share attendance, results and notices in one place.
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
                <Typography variant="body2" sx={{ color: ON_GREEN, opacity: 0.8 }}>
                  Two campuses:
                </Typography>
                {CAMPUSES.map((campus) => (
                  <Box
                    key={campus}
                    sx={{
                      px: 2,
                      py: 0.75,
                      borderRadius: 999,
                      border: "1px solid rgba(244, 241, 232, 0.32)",
                      color: ON_GREEN,
                      fontSize: "0.875rem",
                      fontWeight: 600,
                    }}
                  >
                    {campus}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Reveal>
      </Container>
    </Box>
  );
}
