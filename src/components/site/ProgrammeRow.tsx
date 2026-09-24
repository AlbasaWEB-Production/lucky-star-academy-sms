"use client";

import { useState } from "react";
import { Box, Button, Dialog, DialogContent, IconButton, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";

import Link from "@/components/NextLink";
import PhotoFrame, { STOCK_PLACEHOLDER } from "@/components/site/PhotoFrame";
import { PendingBlock } from "@/components/site/DetailText";
import { programmes } from "@/content/site";
import { BRAND_GOLD, BRAND_GREEN, BRAND_GREEN_DARK, INK } from "@/theme";

/**
 * The school's four programmes, each opening a detail panel.
 *
 * The reference layout's programme row and its dialog, kept because the row is
 * the only place the reference's structure beats separate pages: short
 * summaries a visitor can scan, with the detail one tap away for the two people
 * who want it.
 *
 * The row runs to **four** cards, not the reference's five, because the school
 * teaches four programmes. The fifth slot is not filled with a near-duplicate
 * to keep the grid symmetrical.
 *
 * Both the row and the Academics page read the same `programmes` array, so the
 * two cannot drift apart, and a programme added once appears in both.
 *
 * Client component, because a dialog is state. The data is plain and comes from
 * the content module; nothing is fetched.
 *
 * The photographs are stock placeholders and say so on their face — see
 * `PhotoFrame`. Different crops of one file, so the row does not read as four
 * copies of the same picture.
 */
const CROPS = [
  STOCK_PLACEHOLDER.crops.left,
  STOCK_PLACEHOLDER.crops.centre,
  STOCK_PLACEHOLDER.crops.right,
  STOCK_PLACEHOLDER.crops.upper,
];

export default function ProgrammeRow() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const open = programmes.find((programme) => programme.key === openKey) ?? null;

  return (
    <>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            lg: "repeat(4, minmax(0, 1fr))",
          },
        }}
      >
        {programmes.map((programme, index) => (
          <Box
            key={programme.key}
            component="button"
            type="button"
            onClick={() => setOpenKey(programme.key)}
            aria-haspopup="dialog"
            sx={{
              display: "flex",
              flexDirection: "column",
              textAlign: "left",
              p: 0,
              border: "1px solid",
              borderColor: "divider",
              backgroundColor: "background.paper",
              borderRadius: "20px",
              overflow: "hidden",
              cursor: "pointer",
              font: "inherit",
              color: INK,
              transition: "transform 200ms ease, box-shadow 200ms ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 14px 30px rgba(8, 62, 40, 0.10)",
              },
              "&:hover .programme-arrow": { transform: "translateX(4px)" },
              "&:focus-visible": {
                outline: `3px solid ${BRAND_GREEN_DARK}`,
                outlineOffset: 3,
              },
            }}
          >
            <PhotoFrame
              src={STOCK_PLACEHOLDER.src}
              alt=""
              objectPosition={CROPS[index % CROPS.length]}
              aspectRatio="16 / 10"
              sizes="(max-width: 599px) 100vw, (max-width: 1199px) 50vw, 320px"
              radius="0"
            />

            <Box sx={{ display: "flex", flexDirection: "column", flex: 1, p: 2.5 }}>
              <Typography
                component="h3"
                sx={{
                  fontFamily: "var(--font-fraunces)",
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  lineHeight: 1.3,
                  color: BRAND_GREEN_DARK,
                }}
              >
                {programme.name}
              </Typography>

              <Typography
                sx={{
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                  color: "text.secondary",
                  mt: 1,
                  flex: 1,
                }}
              >
                {programme.summary}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  mt: 2.5,
                  pt: 1.5,
                  borderTop: "1px solid",
                  borderColor: "divider",
                  color: "#AF7C12",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                <Box component="span">{programme.meta}</Box>
                <ArrowForwardIcon
                  className="programme-arrow"
                  sx={{ fontSize: 18, transition: "transform 200ms ease" }}
                />
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      <Dialog
        open={open !== null}
        onClose={() => setOpenKey(null)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="programme-dialog-title"
      >
        {open ? (
          <DialogContent sx={{ p: { xs: 3, sm: 4 } }}>
            <IconButton
              onClick={() => setOpenKey(null)}
              aria-label="Close"
              sx={{ position: "absolute", top: 12, right: 12 }}
            >
              <CloseIcon />
            </IconButton>

            <Typography variant="overline" sx={{ color: "#AF7C12", fontWeight: 700 }}>
              {open.meta}
            </Typography>

            <Typography
              id="programme-dialog-title"
              component="h2"
              sx={{
                fontFamily: "var(--font-fraunces)",
                fontSize: { xs: "1.5rem", sm: "1.875rem" },
                fontWeight: 600,
                lineHeight: 1.15,
                color: BRAND_GREEN_DARK,
                mt: 1,
                mb: 2.5,
                pr: 4,
              }}
            >
              {open.name}
            </Typography>

            {/* The classes or subjects inside the programme. Every entry here
                was supplied by the school, so it renders as real content even
                while the paragraph beneath it is still open. */}
            <Box
              component="ul"
              sx={{
                listStyle: "none",
                m: 0,
                p: 0,
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                mb: 3,
              }}
            >
              {open.courses.map((course) => (
                <Box
                  component="li"
                  key={course}
                  sx={{
                    px: 1.5,
                    py: 0.6,
                    borderRadius: "999px",
                    backgroundColor: "rgba(20, 123, 69, 0.09)",
                    color: BRAND_GREEN_DARK,
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                  }}
                >
                  {course}
                </Box>
              ))}
            </Box>

            <PendingBlock
              detail={open.body}
              fallback={open.fallback}
              sx={{ color: "text.secondary", lineHeight: 1.75 }}
            />

            <Box sx={{ display: "flex", gap: 1.5, mt: 4, flexWrap: "wrap" }}>
              <Button
                component={Link}
                href="/academics"
                variant="contained"
                sx={{
                  backgroundColor: BRAND_GREEN,
                  "&:hover": { backgroundColor: BRAND_GREEN_DARK },
                }}
              >
                All academics
              </Button>
              <Button
                component={Link}
                href="/contact"
                variant="outlined"
                sx={{ color: BRAND_GREEN_DARK, borderColor: "divider" }}
              >
                Ask the office
              </Button>
            </Box>

            <Typography variant="caption" sx={{ display: "block", mt: 3, color: "text.secondary" }}>
              <Box component="span" sx={{ color: BRAND_GOLD, fontWeight: 700 }}>
                ●{" "}
              </Box>
              {STOCK_PLACEHOLDER.credit}
            </Typography>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}
