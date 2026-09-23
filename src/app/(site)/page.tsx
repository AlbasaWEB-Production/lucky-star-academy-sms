import { Box, Typography } from "@mui/material";
import type { Metadata } from "next";

import HomeHero from "@/components/site/HomeHero";
import CTABand from "@/components/site/CTABand";
import Card from "@/components/site/Card";
import EmptyPanel from "@/components/site/EmptyPanel";
import Reveal from "@/components/site/Reveal";
import Section, { SectionHeading } from "@/components/site/Section";
import { PendingBlock } from "@/components/site/DetailText";
import Link from "@/components/NextLink";
import { highlights, school, welcome } from "@/content/site";
import { formatNewsDate, listNews } from "@/content/news";
import { JsonLd, schoolJsonLd } from "@/lib/site/structured-data";
import { BRAND_GREEN } from "@/theme";

/**
 * The public website's home page.
 *
 * Replaces the portal-gateway landing page that used to sit at `/` — that page's
 * real job, five sign-in cards, is the login chooser at `/login`, which the
 * portal subdomain now opens on directly.
 *
 * Grounds alternate so no two adjacent bands share a colour:
 * hero (deep green) → welcome (off-white) → highlights (white) → news
 * (off-white) → call to action (deep green).
 */

/** The facts we can state without inventing anything. */
const FACTS: readonly { label: string; value: string }[] = [
  { label: "Established", value: school.founded },
  { label: "Classes", value: school.levels },
  { label: "Campuses", value: school.campuses.join(" & ") },
  { label: "Location", value: `${school.town}, ${school.region}` },
];

/**
 * The home page's title is `absolute` for a specific reason.
 *
 * A layout's `title.default` — which is what the home page would otherwise
 * inherit from `(site)/layout.tsx` — is augmented by the parent segment's
 * `title.template`. The parent here is the root layout, whose template is
 * `%s | Lucky Star Academy SMS`. The school's front page therefore came out as
 * "… | Lucky Star Academy SMS", advertising the management system in the
 * search result for the school itself.
 *
 * `title.absolute` ignores parent templates, so this is the one page that has
 * to state its title in full. Every other page sets its own title and correctly
 * picks up `%s | Lucky Star Academy` from the group layout.
 */
export const metadata: Metadata = {
  title: {
    absolute: `${school.name} — ${school.levels} in ${school.town}, Ghana`,
  },
  description: `${school.name} is a ${school.levels} school in ${school.town}, ${school.region}, Ghana. Established ${school.founded}. ${school.motto}.`,
};

export default function HomePage() {
  const news = listNews();
  const latest = news.slice(0, 3);

  return (
    <>
      <JsonLd data={schoolJsonLd()} />

      <HomeHero />

      {/* Welcome ------------------------------------------------------- */}
      <Section tone="default" labelledBy="home-welcome-heading">
        <Box
          sx={{
            display: "grid",
            gap: { xs: 5, md: 7 },
            gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" },
            alignItems: "start",
          }}
        >
          <Box>
            <SectionHeading
              id="home-welcome-heading"
              overline={welcome.overline}
              title={welcome.heading}
            />
            <Reveal>
              <PendingBlock
                detail={welcome.body}
                fallback={welcome.bodyFallback}
                sx={{ color: "text.secondary", fontSize: "1.0625rem", lineHeight: 1.75 }}
              />
            </Reveal>
          </Box>

          {/* Fact rail — every line here is verified, so it is safe to lead with. */}
          <Reveal delayMs={120}>
            <Box
              sx={{
                backgroundColor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "20px",
                p: { xs: 3, md: 3.5 },
              }}
            >
              <Typography variant="overline" sx={{ color: "text.secondary" }}>
                At a glance
              </Typography>

              <Box component="dl" sx={{ m: 0, mt: 2 }}>
                {FACTS.map((item, index) => (
                  <Box
                    key={item.label}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: 2,
                      py: 1.75,
                      borderTop: index === 0 ? "none" : "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Box component="dt" sx={{ color: "text.secondary", fontSize: "0.9375rem" }}>
                      {item.label}
                    </Box>
                    <Box
                      component="dd"
                      sx={{
                        m: 0,
                        fontWeight: 700,
                        color: "secondary.main",
                        textAlign: "right",
                      }}
                    >
                      {item.value}
                    </Box>
                  </Box>
                ))}
              </Box>

              <Typography
                variant="body2"
                sx={{ mt: 2.5, color: "text.secondary", fontStyle: "italic" }}
              >
                &ldquo;{school.motto}&rdquo;
              </Typography>
            </Box>
          </Reveal>
        </Box>
      </Section>

      {/* What the school is -------------------------------------------- */}
      <Section tone="paper" labelledBy="home-highlights-heading">
        <SectionHeading
          id="home-highlights-heading"
          overline="Our school"
          title="What Lucky Star Academy is"
          lead="A short, plain account of the school — no claims we cannot support."
        />

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              lg: "repeat(4, 1fr)",
            },
          }}
        >
          {highlights.map((item, index) => (
            <Reveal key={item.title} delayMs={index * 80}>
              <Card title={item.title} body={item.body} />
            </Reveal>
          ))}
        </Box>
      </Section>

      {/* News ---------------------------------------------------------- */}
      <Section tone="default" labelledBy="home-news-heading">
        <SectionHeading
          id="home-news-heading"
          overline="News"
          title="From the school"
          lead="Announcements, events and term information from the office."
        />

        {latest.length > 0 ? (
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            }}
          >
            {latest.map((post) => (
              <Card key={post.slug} title={post.title} body={post.summary}>
                <Typography
                  variant="caption"
                  sx={{ mt: 2, color: "text.secondary", display: "block" }}
                >
                  {formatNewsDate(post.date)}
                </Typography>
              </Card>
            ))}
          </Box>
        ) : (
          <EmptyPanel
            title="No announcements published yet"
            action={
              <Link
                href="/contact"
                style={{ color: BRAND_GREEN, fontWeight: 600, textDecoration: "underline" }}
              >
                Contact the school office
              </Link>
            }
          >
            <p>
              This is where the school will post news, events and term information. Nothing has
              been published yet.
            </p>
            <p>
              For anything you need in the meantime — term dates, fees, or your child&rsquo;s
              progress — please contact the school office directly.
            </p>
          </EmptyPanel>
        )}

        {news.length > 3 ? (
          <Box sx={{ textAlign: "center", mt: 5 }}>
            <Link
              href="/news"
              style={{ color: BRAND_GREEN, fontWeight: 600, textDecoration: "underline" }}
            >
              All news &rarr;
            </Link>
          </Box>
        ) : null}
      </Section>

      <CTABand />
    </>
  );
}
