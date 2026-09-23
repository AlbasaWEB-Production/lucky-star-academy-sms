import { Box, Container, Typography } from "@mui/material";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";

import DetailText from "@/components/site/DetailText";
import { valueBand } from "@/content/site";
import { BRAND_GOLD, HERO_GREEN, ON_GREEN } from "@/theme";

/**
 * The five short claims, in a dark band that overlaps the hero's lower edge —
 * the reference layout's "what makes us special" strip.
 *
 * Its five items are the school's own facts, except the last, which is the
 * school's values and is held open as a placeholder. The reference fills that
 * slot with adjectives ("A place to belong"); adjectives are not facts, and a
 * school's stated values are the school's to give.
 *
 * Icons are paired by position. `valueBand` is a fixed five, and the reference's
 * band is a fixed five columns, so the coupling is deliberate rather than
 * accidental — the `%` guard means a sixth entry can never render without an
 * icon.
 */
const ICONS = [
  SchoolOutlinedIcon,
  ApartmentOutlinedIcon,
  HistoryEduOutlinedIcon,
  FactCheckOutlinedIcon,
  FavoriteBorderOutlinedIcon,
];

export default function ValuesBand() {
  return (
    <Box
      sx={{
        position: "relative",
        zIndex: 3,
        // Pulls the band up over the hero's foot, as the reference does.
        mt: { xs: -3, md: -4 },
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            backgroundColor: HERO_GREEN,
            color: "#FFFFFF",
            borderRadius: "12px",
            px: { xs: 2, md: 1.5 },
            py: { xs: 3, md: 3.5 },
            boxShadow: "0 14px 40px rgba(8, 62, 40, 0.18)",
            display: "grid",
            gap: { xs: 3, md: 0 },
            gridTemplateColumns: {
              xs: "1fr 1fr",
              sm: "1fr 1fr",
              md: "repeat(5, minmax(0, 1fr))",
            },
          }}
        >
          {valueBand.map((item, index) => {
            const Icon = ICONS[index % ICONS.length];

            return (
              <Box
                key={item.title}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                  px: { xs: 0.5, md: 2 },
                  borderRight: { xs: "none", md: "1px solid rgba(244, 241, 232, 0.18)" },
                  "&:last-of-type": { borderRight: "none" },
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    flexShrink: 0,
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    border: `1px solid ${BRAND_GOLD}88`,
                    color: BRAND_GOLD,
                    "& svg": { fontSize: 22 },
                  }}
                >
                  <Icon />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    component="h2"
                    sx={{
                      fontSize: "0.9375rem",
                      fontWeight: 700,
                      lineHeight: 1.35,
                      mb: 0.5,
                      color: "#FFFFFF",
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    component="div"
                    sx={{ fontSize: "0.8125rem", lineHeight: 1.6, color: ON_GREEN, opacity: 0.9 }}
                  >
                    <DetailText detail={item.body} />
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
