import Image from "next/image";
import { Box, type SxProps, type Theme } from "@mui/material";

import { BRAND_GOLD, BRAND_GREEN_DARK, SURFACE_MUTED } from "@/theme";

/**
 * A photograph, with the stock placeholder clearly on the face of it.
 *
 * **Why this component exists.** The reference layout is illustrated entirely
 * with stock photographs of children who do not attend Lucky Star Academy — the
 * hero is a Western schoolgirl in a navy blazer. Those images are being used
 * here as temporary stand-ins so the finished layout can be reviewed, which the
 * school's own developer asked for explicitly on the condition that they are
 * labelled as stock.
 *
 * So every one of them carries a visible badge, on the image, that says so. Not
 * a note in a README, not an HTML comment — a mark a parent would see, because
 * the failure mode being guarded against is a viewer mistaking a stock classroom
 * for this school's classroom, and only a badge on the picture prevents that.
 *
 * The badge is also why this is a component rather than a bare `next/image`: the
 * alternative is remembering to add the label at each of the nine call sites,
 * and the tenth one is the one that gets missed.
 *
 * `objectPosition` replaces the reference's `--cx/--cy/--cw/--ch` crop maths. It
 * achieves the same thing — several distinct framings of one file, with no extra
 * downloads — without upscaling a small region, which is what made the
 * reference's crops soft.
 */
export default function PhotoFrame({
  src,
  alt,
  /** The crop of the source image to show, e.g. `"30% 20%"`. */
  objectPosition = "50% 50%",
  aspectRatio = "4 / 3",
  /** `sizes` for next/image. Keep it close to the rendered width. */
  sizes = "(max-width: 899px) 100vw, 50vw",
  /** Says on the image that this is not the school's own photograph. */
  stock = true,
  /** A caption in the school's voice, laid over the foot of the image. */
  caption,
  priority = false,
  radius = "20px",
  sx,
}: {
  src: string;
  alt: string;
  objectPosition?: string;
  /** A CSS aspect ratio, either fixed or per breakpoint. */
  aspectRatio?: string | Partial<Record<"xs" | "sm" | "md" | "lg" | "xl", string>>;
  sizes?: string;
  stock?: boolean;
  caption?: string;
  priority?: boolean;
  radius?: string;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      sx={[
        {
          position: "relative",
          overflow: "hidden",
          borderRadius: radius,
          backgroundColor: SURFACE_MUTED,
          aspectRatio,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        style={{ objectFit: "cover", objectPosition }}
      />

      {/* A caption in the school's own voice sits over a scrim at the foot. */}
      {caption ? (
        <>
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: "45% 0 0",
              background: `linear-gradient(transparent, ${BRAND_GREEN_DARK}cc)`,
            }}
          />
          <Box
            component="p"
            sx={{
              position: "absolute",
              left: { xs: 20, md: 28 },
              right: { xs: 20, md: 28 },
              bottom: { xs: 18, md: 24 },
              m: 0,
              color: "#FFFFFF",
              fontFamily: "var(--font-fraunces)",
              fontSize: { xs: "1.125rem", md: "1.375rem" },
              lineHeight: 1.25,
              textShadow: "0 2px 12px rgba(0,0,0,0.4)",
            }}
          >
            {caption}
          </Box>
        </>
      ) : null}

      {stock ? (
        <Box
          sx={{
            position: "absolute",
            top: 10,
            left: 10,
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            px: 1,
            py: 0.4,
            borderRadius: "999px",
            backgroundColor: "rgba(26, 26, 26, 0.82)",
            color: "#FFFFFF",
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            backdropFilter: "blur(4px)",
          }}
        >
          <Box
            aria-hidden
            sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: BRAND_GOLD }}
          />
          Stock photo
        </Box>
      ) : null}

      {/* Read out to a screen reader, which cannot see the badge. */}
      {stock ? (
        <Box
          component="span"
          sx={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
            clip: "rect(0 0 0 0)",
            whiteSpace: "nowrap",
          }}
        >
          Placeholder image: a stock photograph, not a photograph of Lucky Star Academy.
        </Box>
      ) : null}
    </Box>
  );
}

/** Where the placeholder photographs live, and what has to happen to them. */
export const STOCK_PLACEHOLDER = {
  /**
   * JPEG, not the PNG the reference ships. It is a photograph, so PNG stored it
   * at 1.8 MB for no benefit — twelve times what the same file costs as JPEG at
   * quality 88, and a placeholder is not a pixel-exact artefact. `next/image`
   * re-encodes it per request in any case.
   */
  src: "/placeholders/stock-classroom.jpg",
  credit:
    "Stock photograph used as a temporary stand-in. Replace with the school's own photograph before launch.",
  /** Distinct framings of the one file, so the layout does not repeat itself. */
  crops: {
    centre: "50% 42%",
    left: "8% 55%",
    right: "96% 45%",
    upper: "62% 12%",
    lower: "30% 88%",
    window: "4% 8%",
  },
} as const;
