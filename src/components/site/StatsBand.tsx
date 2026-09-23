import { Box, Container, Typography } from "@mui/material";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

import { statsBand, type StatKey } from "@/content/site";
import { BRAND_GOLD, HERO_GREEN, ON_GREEN } from "@/theme";

/**
 * The numbers strip — a full-bleed dark band of five figures.
 *
 * **Every value on it is a placeholder, and that is the point.**
 *
 * The reference layout carries 25+ years, 1,500+ students, 120+ teachers, 100+
 * awards and 98% university acceptance. Those describe a different school
 * entirely, and the last one describes a school Lucky Star is not: it teaches
 * Primary 1-6, so "university acceptance" has no meaning. The honest analogue is
 * how many Primary 6 pupils go on to junior high.
 *
 * The layout's developer asked for the slots to be kept and the values marked
 * "To be confirmed" rather than filled with the reference's illustrative
 * numbers, on the grounds that a plausible-looking figure on a real school's
 * website is indistinguishable from a true one. That is the same reasoning
 * `DECISIONS.md` § 2 records, and it is why this band looks unfinished on
 * purpose: it is a to-do list the school can read.
 */
const ICONS: Record<StatKey, typeof SchoolOutlinedIcon> = {
  years: HistoryOutlinedIcon,
  pupils: GroupsOutlinedIcon,
  teachers: PersonOutlineOutlinedIcon,
  awards: EmojiEventsOutlinedIcon,
  progress: SchoolOutlinedIcon,
};

export default function StatsBand() {
  return (
    <Box
      component="section"
      aria-label="The school in numbers"
      sx={{ backgroundColor: HERO_GREEN, color: "#FFFFFF" }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "grid",
            gap: { xs: 3, sm: 3.5, md: 0 },
            gridTemplateColumns: {
              xs: "1fr 1fr",
              sm: "repeat(3, minmax(0, 1fr))",
              md: "repeat(5, minmax(0, 1fr))",
            },
            py: { xs: 4, md: 3.5 },
          }}
        >
          {statsBand.map((stat) => {
            const Icon = ICONS[stat.key];
            const isPending = stat.value.pending === true;

            return (
              <Box
                key={stat.key}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: { xs: 0, md: 2 },
                  borderRight: { xs: "none", md: "1px solid rgba(244, 241, 232, 0.18)" },
                  "&:last-of-type": { borderRight: "none" },
                  justifyContent: { xs: "flex-start", md: "center" },
                }}
              >
                <Box
                  aria-hidden
                  sx={{ flexShrink: 0, color: BRAND_GOLD, "& svg": { fontSize: 34 } }}
                >
                  <Icon />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  {isPending ? (
                    <Typography
                      component="div"
                      data-pending="true"
                      sx={{
                        fontStyle: "italic",
                        fontSize: "0.9375rem",
                        lineHeight: 1.3,
                        color: ON_GREEN,
                        borderBottom: "1px dashed",
                        borderColor: "currentColor",
                        display: "inline-block",
                      }}
                    >
                      {stat.value.value}
                    </Typography>
                  ) : (
                    <Typography
                      component="div"
                      sx={{
                        fontFamily: "var(--font-fraunces)",
                        fontSize: "1.75rem",
                        lineHeight: 1.15,
                        color: "#FFFFFF",
                      }}
                    >
                      {stat.value.value}
                    </Typography>
                  )}

                  <Typography
                    component="div"
                    sx={{ fontSize: "0.75rem", color: ON_GREEN, opacity: 0.9, mt: 0.5 }}
                  >
                    {stat.label}
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
