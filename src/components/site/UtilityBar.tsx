import { Box, Container, Typography } from "@mui/material";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";

import Link from "@/components/NextLink";
import { contact, isKnown, school } from "@/content/site";
import { portalHref } from "@/lib/site/host";
import { BRAND_GOLD, BRAND_GREEN_DARK, ON_GREEN } from "@/theme";

/**
 * The thin bar above the header — the reference layout's first element.
 *
 * It carries the two things a parent looks for before anything else: how to
 * reach the school, and how to sign in to the portal.
 *
 * **Only reachable details are rendered as links.** The telephone and email are
 * still pending, and a `tel:` link built from a placeholder is worse than no
 * link at all — it looks actionable and dials nowhere. Each one is gated on
 * `isKnown()`, so the bar gains a working link the moment the school supplies
 * the value, with no code change.
 *
 * On a phone the contact block is dropped and only the portal link remains, the
 * same as the reference: three contact lines do not fit in 360px, and the
 * Contact page is one tap away in the menu.
 */
export default function UtilityBar() {
  const hasPhone = isKnown(contact.phone);
  const hasEmail = isKnown(contact.email);

  return (
    <Box
      component="div"
      sx={{
        backgroundColor: BRAND_GREEN_DARK,
        color: ON_GREEN,
        fontSize: "0.75rem",
        borderBottom: "1px solid rgba(244, 241, 232, 0.14)",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          minHeight: 38,
          py: { xs: 0.75, sm: 0 },
        }}
      >
        {/* Contact — hidden on phones, where only the portal link survives. */}
        <Box
          sx={{
            display: { xs: "none", sm: "flex" },
            alignItems: "center",
            gap: { sm: 2.5, md: 3.5 },
            flexWrap: "wrap",
            minWidth: 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <LocationOnOutlinedIcon sx={{ fontSize: 15, color: BRAND_GOLD }} />
            <Box component="span">
              {school.town}, {school.region}
            </Box>
          </Box>

          {hasPhone ? (
            <Box
              component="a"
              href={`tel:${contact.phone.value.replace(/\s+/g, "")}`}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                color: "inherit",
                textDecoration: "none",
                "&:hover": { color: BRAND_GOLD },
              }}
            >
              <PhoneOutlinedIcon sx={{ fontSize: 15, color: BRAND_GOLD }} />
              <Box component="span">{contact.phone.value}</Box>
            </Box>
          ) : null}

          {hasEmail ? (
            <Box
              component="a"
              href={`mailto:${contact.email.value}`}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                color: "inherit",
                textDecoration: "none",
                "&:hover": { color: BRAND_GOLD },
              }}
            >
              <MailOutlinedIcon sx={{ fontSize: 15, color: BRAND_GOLD }} />
              <Box component="span">{contact.email.value}</Box>
            </Box>
          ) : null}
        </Box>

        {/* Portal — always visible, on both sizes. */}
        <Box
          component="a"
          href={portalHref("/login")}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            color: "inherit",
            textDecoration: "none",
            fontWeight: 600,
            ml: "auto",
            py: 0.5,
            "&:hover": { color: BRAND_GOLD },
            "&:focus-visible": { outline: `2px solid ${BRAND_GOLD}`, outlineOffset: 2 },
          }}
        >
          <LoginOutlinedIcon sx={{ fontSize: 15, color: BRAND_GOLD }} />
          <Typography component="span" sx={{ fontSize: "inherit", fontWeight: 600 }}>
            Portal login
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
