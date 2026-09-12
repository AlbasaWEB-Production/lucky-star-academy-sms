"use client";

import { createTheme } from "@mui/material/styles";

/**
 * Theme ported from the legacy app.
 *
 * The purple palette and the 240px drawer width come from the original
 * `frontend/src/components/buttonStyles.js` and `styles.js`, so the redesign
 * keeps the familiar look.
 *
 * Structural changes from the old styled-components approach:
 *   - The button variants are now real theme variants (`variant="contained"`
 *     with a `color`), instead of nine near-identical styled() wrappers.
 *   - Layout uses Box/Stack + CSS grid rather than MUI's Grid component,
 *     whose prop API has changed across MUI majors.
 */

export const DRAWER_WIDTH = 240;

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#7f56da",
      dark: "#5c33b8",
      light: "#a480e6",
    },
    secondary: {
      main: "#270843",
    },
    success: {
      main: "#266810",
    },
    error: {
      main: "#c62828",
    },
    info: {
      main: "#080a43",
    },
    background: {
      default: "#f7f7fb",
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
          backgroundColor: "#000000",
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
            backgroundColor: "rgba(127, 86, 218, 0.04)",
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
