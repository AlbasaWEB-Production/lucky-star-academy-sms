"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";

import Link from "@/components/NextLink";
import PhotoFrame, { STOCK_PLACEHOLDER } from "@/components/site/PhotoFrame";
import { PendingBlock } from "@/components/site/DetailText";
import { programmeCards } from "@/content/site";
import { BRAND_GOLD, BRAND_GREEN, BRAND_GREEN_DARK, INK } from "@/theme";

/**
 * The five curriculum cards, each opening a detail panel.
 *
 * This is the reference layout's programme row and its dialog, kept because the
 * row is the only place the reference's structure beats separate pages: five
 * short summaries a visitor can scan, with the detail one tap away for the two
 * people who want it.
 *
 * The row and the Academics page describe the same five things — `programmeCards`
 * is derived from `academics` in the content module, so neither can drift from
 * the other, and a detail filled in once appears in both places.
 *
 * Client component, because a dialog is state. The data is plain and comes from
 * the content module; nothing is fetched.
 *
 * The photographs are stock placeholders and say so on their face — see
 * `PhotoFrame`. Five different crops of one file, so the row does not read as
 * five copies of the same picture.
 */
const CROPS = [
  STOCK_PLACEHOLDER.crops.left,
  STOCK_PLACEHOLDER.crops.centre,
  STOCK_PLACEHOLDER.crops.right,
  STOCK_PLACEHOLDER.crops.lower,
  STOCK_PLACEHOLDER.crops.upper,
];

export default function ProgrammeRow() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const open = programmeCards.find((card) => card.key === openKey) ?? null;

  return (
    <>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "repeat(3, minmax(0, 1fr))",
            lg: "repeat(5, minmax(0, 1fr))",
          },
        }}
      >
        {programmeCards.map((card, index) => (
          <Box
            key={card.key}
            component="button"
            type="button"
            onClick={() => setOpenKey(card.key)}
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
              sizes="(max-width: 599px) 100vw, (max-width: 1199px) 50vw, 260px"
              radius="0"
            />

            <Box sx={{ display: "flex", flexDirection: "column", flex: 1, p: 2.5 }}>
              <Typography
                component="h3"
                sx={{
                  fontFamily: "var(--font-fraunces)",
                  fontSize: "1.0625rem",
                  fontWeight: 600,
                  lineHeight: 1.3,
                  color: BRAND_GREEN_DARK,
                }}
              >
                {card.title}
              </Typography>

              <Typography
                sx={{ fontSize: "0.875rem", lineHeight: 1.6, color: "text.secondary", mt: 1, flex: 1 }}
              >
                {card.summary}
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
                <Box component="span">{card.meta}</Box>
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
              {open.title}
            </Typography>

            <PendingBlock
              detail={open.detail}
              fallback={open.fallback}
              sx={{ color: "text.secondary", lineHeight: 1.75 }}
            />

            <Box sx={{ display: "flex", gap: 1.5, mt: 4, flexWrap: "wrap" }}>
              <Button
                component={Link}
                href="/academics"
                variant="contained"
                sx={{ backgroundColor: BRAND_GREEN, "&:hover": { backgroundColor: BRAND_GREEN_DARK } }}
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
