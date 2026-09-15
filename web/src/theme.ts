"use client";

import { createTheme } from "@mui/material/styles";

/**
 * Lucky Star Academy theme.
 *
 * Replaces the purple palette inherited from the legacy MERN app with the
 * school's own colours, taken from the admission flyer and the crest: a deep
 * grass green as the working colour and the crest's gold as an accent.
 *
 * Two deliberate choices worth knowing before you change anything here:
 *
 *   - `secondary` is a very dark green rather than the gold. Across the app
 *     `secondary.main` is used as an ink colour for headings and for the text
 *     on the white hero button, so it has to stay dark enough to read on
 *     white. Swapping gold in there would drop those to about 1.9:1 against
 *     the page and fail contrast everywhere at once.
 *   - The gold is therefore exported as a constant instead, for use as a
 *     border, underline or filled chip with dark text on top. It is a
 *     background colour, never a text colour on white.
 *
 * Structural notes carried over from the original port: button variants are
 * real theme variants rather than styled() wrappers, and layout uses Box and
 * CSS grid rather than MUI's Grid, whose prop API churns across majors.
 */

export const DRAWER_WIDTH = 240;

/** Crest gold. Use as a fill or rule, with dark text over it — never as text on white. */
export const BRAND_GOLD = "#F2B705";

/** The deep green the landing hero's scrim is built from. */
export const BRAND_GREEN_DARK = "#083E28";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#147B45",
      dark: "#0B5E33",
      light: "#4CA76F",
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
      default: "#F6F8F6",
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "Helvetica Neue",
      "Arial",
      "sans-serif",
    ].join(","),
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
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
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          // Was pure black, which read as a bar of ink across every table.
          backgroundColor: BRAND_GREEN_DARK,
          color: "#ffffff",
          fontWeight: 600,
        },
        body: {
          fontSize: 14,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:nth-of-type(odd)": {
            backgroundColor: "rgba(20, 123, 69, 0.04)",
          },
          "&:last-child td, &:last-child th": {
            border: 0,
          },
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
        },
      },
    },
  },
});

export default theme;
