import type { ElementType } from "react";
import Image from "next/image";
import { Box, type SxProps, type Theme } from "@mui/material";

/**
 * Intrinsic pixel size of `public/lucky_star_logo.png`.
 *
 * next/image needs the real dimensions so it can reserve layout space, so they
 * are recorded once here instead of at every call site.
 */
const LOGO_WIDTH = 1372;
const LOGO_HEIGHT = 1146;

/**
 * The Lucky Star Academy crest.
 *
 * The source PNG has a genuinely transparent background (verified: corner
 * pixels are alpha 0), so the same file sits on the dark landing hero and on
 * white login cards without a plate behind it.
 *
 * Rendered through next/image, so visitors get a downscaled, modern-format
 * variant rather than the 1 MB original. Size it with a height on `sx` - the
 * aspect ratio follows automatically.
 */
export default function SchoolLogo({
  sx,
  sizes = "200px",
  alt = "Lucky Star Academy",
  component = "span",
  decorative = false,
  priority = false,
}: {
  /** Set `height` here. Responsive values are supported. */
  sx?: SxProps<Theme>;
  /**
   * Rendered CSS width of the crest, as a `sizes` attribute.
   *
   * Without this, next/image assumes the logo spans the viewport and offers
   * only the largest candidates (1920px/3840px) - an upscale of the 1372px
   * source, and a bigger download than the original file. Pass a value close
   * to the width the logo actually occupies.
   */
  sizes?: string;
  alt?: string;
  /**
   * Element to render. Defaults to `span` so the logo may be dropped inside a
   * heading without producing invalid markup; pass `h1` to make the crest
   * itself the page heading.
   */
  component?: ElementType;
  /** Hide from assistive tech where adjacent text already names the school. */
  decorative?: boolean;
  /** Preload. Use for the logo that appears above the fold. */
  priority?: boolean;
}) {
  return (
    <Box
      component={component}
      sx={[
        { display: "flex", alignItems: "center" },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Image
        src="/lucky_star_logo.png"
        alt={decorative ? "" : alt}
        aria-hidden={decorative || undefined}
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        sizes={sizes}
        priority={priority}
        style={{ height: "100%", width: "auto", display: "block" }}
      />
    </Box>
  );
}
