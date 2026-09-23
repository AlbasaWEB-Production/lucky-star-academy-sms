import type { Metadata } from "next";
import { Box, Typography } from "@mui/material";

import CTABand from "@/components/site/CTABand";
import EmptyPanel from "@/components/site/EmptyPanel";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/site/Reveal";
import Section, { SectionHeading } from "@/components/site/Section";
import Link from "@/components/NextLink";
import { formatNewsDate, listNews } from "@/content/news";
import { school } from "@/content/site";
import { pageMetadata } from "@/lib/site/metadata";
import { BRAND_GREEN } from "@/theme";

export const metadata: Metadata = pageMetadata({
  title: "News",
  description: `News, announcements and term information from ${school.name}, ${school.town}, ${school.region}.`,
  path: "/news",
});

/**
 * The News page.
 *
 * It renders whatever is in `src/content/news.ts`, which currently ships empty
 * — so today it shows an honest empty state rather than invented announcements.
 * See the header comment on that file for why that trade was made deliberately.
 *
 * The list is a server component: no state, no client JavaScript, and the whole
 * page is static.
 */
export default function NewsPage() {
  const posts = listNews();

  return (
    <>
      <PageHero
        overline="News"
        title="News and announcements"
        lead="Term dates, events and notices from the school office."
      />

      <Section tone="default" labelledBy="news-list-heading">
        <SectionHeading
          id="news-list-heading"
          overline="Latest"
          title={posts.length > 0 ? "From the school" : "Nothing published yet"}
        />

        {posts.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 860 }}>
            {posts.map((post, index) => (
              <Reveal key={post.slug} delayMs={index * 60}>
                <Box
                  component="article"
                  sx={{
                    backgroundColor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: "20px",
                    p: { xs: 3, md: 3.5 },
                  }}
                >
                  <Typography variant="overline" sx={{ color: "text.secondary" }}>
                    {formatNewsDate(post.date)}
                  </Typography>

                  <Typography
                    component="h3"
                    variant="h6"
                    sx={{ color: "secondary.main", mt: 0.5, mb: 1.5 }}
                  >
                    {post.title}
                  </Typography>

                  <Typography variant="body1" sx={{ color: "text.secondary" }}>
                    {post.summary}
                  </Typography>

                  {post.body?.length ? (
                    <Box sx={{ mt: 2, color: "text.secondary" }}>
                      {post.body.map((paragraph) => (
                        <Typography key={paragraph} variant="body2" sx={{ mb: 1.5 }}>
                          {paragraph}
                        </Typography>
                      ))}
                    </Box>
                  ) : null}
                </Box>
              </Reveal>
            ))}
          </Box>
        ) : (
          <EmptyPanel
            title="The school has not published anything yet"
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
              Announcements, events and term information will appear on this page as the school
              publishes them.
            </p>
            <p>
              Nothing has been published yet, so this page is empty rather than filled with
              placeholder news. For term dates, fees or anything urgent, please contact the school
              office directly.
            </p>
          </EmptyPanel>
        )}
      </Section>

      <CTABand
        heading="Need an answer now?"
        lead="The school office can help with term dates, fees and anything about your child's schooling."
        primaryLabel="Contact the office"
        primaryHref="/contact"
        secondaryLabel="About the school"
        secondaryHref="/about"
      />
    </>
  );
}
