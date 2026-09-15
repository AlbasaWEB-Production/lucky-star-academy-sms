import Link from "@/components/NextLink";
import { Box, Typography } from "@mui/material";

/**
 * Product-wide footer credit.
 *
 * Server-safe (no state), small and muted, centred. The only third-party
 * reference on the page is the AlbasaWEB credit — no other badge or link. The
 * current year is computed at render, and the school name is passed in by the
 * caller so the signed-in shell can show its own school.
 */
export default function SiteFooter({
  schoolName = "Lucky Star Academy",
}: {
  schoolName?: string;
}) {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{ py: 3, px: 2, textAlign: "center", borderTop: "1px solid", borderColor: "divider" }}
    >
      <Typography variant="caption" color="text.secondary">
        © {year} {schoolName} &middot; Designed &amp; Developed by{" "}
        <Link
          href="https://albasaweb.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "inherit", fontWeight: 600 }}
        >
          AlbasaWEB
        </Link>
      </Typography>
    </Box>
  );
}
