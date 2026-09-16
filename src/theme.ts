"use client";

import { createTheme } from "@mui/material/styles";

/**
 * Lucky Star Academy theme.
 *
 * The school's identity is green + gold, expressed entirely through tokens:
 *
 *   - `primary` is the single working colour (crest green). It fills primary
 *     buttons, the active sidebar item, selected chips and the table header
 *     tint. Gold is never a text colour on white — it only appears as a rule,
 *     a fill or a watermark (see the four deliberate placements in DESIGN.md).
 *   - `secondary` is a very dark green that serves as ink for headings and for
 *     button text on white. It has to stay dark enough to read (swapping gold
 *     in would drop contrast to ~1.9:1 and fail AA everywhere at once).
 *
 * Typeface pairing (loaded once in `layout.tsx` through `next/font`, exposed
 * as CSS variables and mapped in here):
 *
 *   - Fraunces (display/identity serif) — the hero, page titles, section
 *     headings and the big numeric values on metric tiles. SOFT axis up,
 *     WONK off.
 *   - Hanken Grotesk (text) — body copy, labels, table text, form fields,
 *     buttons and captions.
 *
 * Radius system: a small intentional set. `shape.borderRadius` stays 8 so
 * numeric `sx` radii remain predictable; the *meanings* below are fixed and
 * used consistently (pill = controls, 12 = inputs, 14 = metric/list tiles,
 * 20 = role/notice/photo cards, 24 = auth card and dialogs).
 */

export const DRAWER_WIDTH = 240;

/** Crest gold. Use as a fill, underline or rule, with dark text over it — never as text on white. */
export const BRAND_GOLD = "#F2B705";

/** Crest green — the single working colour (primary.main). */
export const BRAND_GREEN = "#147B45";

/** The deep green used as ink and in the auth/landing brand panels. */
export const BRAND_GREEN_DARK = "#083E28";

/** The saturated hero/band ground — richer and deeper than BRAND_GREEN, used
 *  for the landing hero and full-bleed sections. Adds approx. 9:1 contrast with
 *  white and the warm off-white below. */
export const HERO_GREEN = "#0B5130";

/** Warm off-white for text on the deep green grounds (reads ≥ 4.5:1 on HERO_GREEN). */
export const ON_GREEN = "#F4F1E8";

/** Off-white page ground. */
export const PAGE_BG = "#F7F7F5";

/** Near-black ink for primary text. */
export const INK = "#1A1A1A";

/** Muted gray for secondary text. */
export const INK_MUTED = "#6B6B6B";

/** Light-gray pill / chip fill. */
export const SURFACE_MUTED = "#F0F0EE";

/** Typefaces, referenced via the CSS variables set on <html> in `layout.tsx`. */
export const DISPLAY_FONT = "var(--font-fraunces)";
export const TEXT_FONT = "var(--font-hanken)";

/** Fraunces is a variable font; SOFT up for warmth, WONK off for steady letterforms. */
const FRAUNCES_SETTINGS = '"SOFT" 100, "WONK" 0';

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#147B45",
      dark: "#0B5E33",
      light: "#4CA76F",
      contrastText: "#ffffff",
    },
    secondary: {
      main: BRAND_GREEN_DARK,
    },
    success: {
      main: "#2E7D32",
    },
    error: {
      main: "#C62828",
    },
    warning: {
      main: "#B26A00",
    },
    info: {
      main: "#0B5E33",
    },
    background: {
      default: PAGE_BG,
      paper: "#ffffff",
    },
    text: {
      primary: INK,
      secondary: INK_MUTED,
    },
    divider: "rgba(0, 0, 0, 0.08)",
  },
  shape: {
    // MUI multiplies a numeric `borderRadius` in `sx` by this value, so a
    // moderate base keeps numeric theme-relative radii predictable. Large,
    // intentional radii are set as explicit px strings below.
    borderRadius: 8,
  },
  typography: {
    fontFamily: TEXT_FONT,
    h1: {
      fontFamily: DISPLAY_FONT,
      fontVariationSettings: FRAUNCES_SETTINGS,
      fontWeight: 600,
      // True display scale: ~40px on a phone, fluid to ~72px on desktop. Only
      // `variant="h1"` consumes this, and the landing hero is its sole user
      // (page titles render through `variant="h5"`, the theme's heading tag),
      // so dashboard/page titles are unaffected.
      fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
      lineHeight: 1.03,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontFamily: DISPLAY_FONT,
      fontVariationSettings: FRAUNCES_SETTINGS,
      fontWeight: 600,
      fontSize: "2rem",
      lineHeight: 1.1,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontFamily: DISPLAY_FONT,
      fontVariationSettings: FRAUNCES_SETTINGS,
      fontWeight: 600,
      fontSize: "1.75rem",
      lineHeight: 1.15,
      letterSpacing: "-0.02em",
    },
    h4: {
      fontFamily: DISPLAY_FONT,
      fontVariationSettings: FRAUNCES_SETTINGS,
      fontWeight: 600,
      fontSize: "1.5rem",
      lineHeight: 1.15,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontFamily: DISPLAY_FONT,
      fontVariationSettings: FRAUNCES_SETTINGS,
      fontWeight: 600,
      fontSize: "1.25rem",
      lineHeight: 1.2,
      letterSpacing: "-0.01em",
    },
    h6: {
      fontFamily: DISPLAY_FONT,
      fontVariationSettings: FRAUNCES_SETTINGS,
      fontWeight: 600,
      fontSize: "1.125rem",
      lineHeight: 1.25,
      letterSpacing: "-0.01em",
    },
    overline: {
      fontFamily: TEXT_FONT,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      fontSize: "0.75rem",
      lineHeight: 1.5,
      color: INK_MUTED,
    },
    button: {
      fontFamily: TEXT_FONT,
      fontWeight: 600,
      textTransform: "none",
    },
    caption: {
      fontFamily: TEXT_FONT,
      fontSize: "0.8125rem",
      lineHeight: 1.5,
    },
    body1: {
      fontFamily: TEXT_FONT,
      lineHeight: 1.6,
    },
    body2: {
      fontFamily: TEXT_FONT,
      lineHeight: 1.6,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 999,
          paddingInline: "20px",
          minHeight: 44,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
        },
        filled: {
          backgroundColor: SURFACE_MUTED,
          color: INK,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 0, 0, 0.12)",
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: "20px",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          // A soft green tint with dark text, so headers read as labels, not a
          // banner across every table.
          backgroundColor: "rgba(20, 123, 69, 0.08)",
          color: BRAND_GREEN_DARK,
          fontWeight: 600,
          fontFamily: TEXT_FONT,
          borderBottom: "1px solid",
          borderBottomColor: "rgba(0, 0, 0, 0.06)",
        },
        body: {
          fontSize: 14,
          color: INK,
          fontFamily: TEXT_FONT,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:nth-of-type(odd)": {
            backgroundColor: "rgba(20, 123, 69, 0.03)",
          },
          "&:hover": {
            backgroundColor: "rgba(20, 123, 69, 0.06)",
          },
          "&:last-child td, &:last-child th": {
            borderBottom: 0,
          },
        },
      },
    },
    MuiTypography: {
      defaultProps: {
        // The app's outline is two levels deep: page titles are `h1` and card /
        // panel titles are `h2`. MUI's defaults render `variant="h5"` / `"h6"`
        // as `<h5>` / `<h6>`, so every page started its outline five levels down
        // and the dashboards would jump h5 (PageHeader) → h2 (ChartCard) → h6
        // (inline titles), which ascends *and* skips. Remap the title and card
        // variants to the levels they semantically are so a page outline is
        // always h1 → h2 and never skips or ascends. Big numeric values
        // (StatCard, the student Figure, the notice day badge) opt out with an
        // explicit `component="div"`, because a number is not a heading.
        // MUI also maps `subtitle1` / `subtitle2` to `<h6>` by default, which
        // put a spurious heading ahead of the page title (the app-bar label and
        // the user name render first) and re-introduced a skip after the
        // section title on notice lists. Those are labels, not headings.
        variantMapping: {
          h1: "h1",
          h2: "h2",
          h3: "h2",
          h4: "h2",
          h5: "h1",
          h6: "h2",
          subtitle1: "div",
          subtitle2: "div",
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: "24px",
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: "14px",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          borderRadius: 999,
        },
      },
    },
  },
});

export default theme;
