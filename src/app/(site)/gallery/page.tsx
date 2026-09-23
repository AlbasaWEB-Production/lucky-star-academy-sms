import type { Metadata } from "next";
import Image from "next/image";
import { Box, Typography } from "@mui/material";

import CTABand from "@/components/site/CTABand";
import DetailText from "@/components/site/DetailText";
import EmptyPanel from "@/components/site/EmptyPanel";
import PageHero from "@/components/site/PageHero";
import Section, { SectionHeading } from "@/components/site/Section";
import { gallery, school } from "@/content/site";
import { pageMetadata } from "@/lib/site/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Gallery",
  description: `Photographs of school life at ${school.name}, ${school.town}, ${school.region}.`,
  path: "/gallery",
});

/**
 * The Gallery page.
 *
 * This page carries a finding worth stating plainly: **the repository contains
 * no usable photographs of the school.**
 *
 *   - `classroom.png` is a generic flat vector illustration, not a photograph.
 *   - `img1–4.png` are 64×64 interface icons.
 *   - `lucky_star_background.png` is an education-themed clip-art background.
 *   - `backg.jpg` is a **watermarked Adobe Stock image** and must not be
 *     published at all — it is unlicensed stock, and the watermark is visible.
 *
 * The only genuine asset is the school's own banner, which is shown here for
 * what it is. Filling the rest with stock photography would tell a lie in
 * pictures — a parent would read a stranger's classroom as their child's — so
 * the page opens with the one real image and an honest request for the rest.
 *
 * Publishing photographs of identifiable pupils also needs the school's
 * position on parental consent, which is recorded as pending rather than
 * assumed.
 */
export default function GalleryPage() {
  return (
    <>
      <PageHero overline="Gallery" title={gallery.heading} lead={gallery.lead} />

      <Section tone="default" labelledBy="gallery-banner-heading">
        <SectionHeading
          id="gallery-banner-heading"
          overline="Our school"
          title="The school's banner"
        />

        <Box
          component="figure"
          sx={{ m: 0, maxWidth: 900 }}
        >
          <Box
            sx={{
              position: "relative",
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              aspectRatio: "16 / 9",
              backgroundColor: "background.paper",
            }}
          >
            <Image
              src="/sms_background_image.png"
              alt={`The banner of ${school.name}, showing the school crest and the school's motto`}
              fill
              sizes="(max-width: 900px) 100vw, 900px"
              style={{ objectFit: "cover" }}
            />
          </Box>

          <Typography
            component="figcaption"
            variant="caption"
            sx={{ display: "block", mt: 1.5, color: "text.secondary" }}
          >
            The school&rsquo;s banner, carrying the crest, the school name and the motto
            &ldquo;{school.motto}&rdquo;.
          </Typography>
        </Box>
      </Section>

      <Section tone="paper" labelledBy="gallery-pending-heading">
        <SectionHeading
          id="gallery-pending-heading"
          overline="Photographs"
          title="More photographs are on their way"
          lead="We would rather show you nothing than show you somebody else's school."
        />

        <EmptyPanel title="No photographs of the school have been supplied yet">
          <p>
            We are collecting photographs of the school — the campuses, the classrooms, pupils at
            work and school events — to publish here.
          </p>
          <p>
            Until the school sends them, this page shows only the school&rsquo;s own banner. It is
            not filled with stock photographs, because a picture of another school&rsquo;s classroom
            would mislead you about ours.
          </p>
          <Box sx={{ mt: 2, textAlign: "left", maxWidth: 520, mx: "auto" }}>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
              What we still need
            </Typography>
            <DetailText detail={gallery.needs} sx={{ color: "text.secondary" }} />
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block", mt: 1.5, mb: 0.5 }}
            >
              Before any photograph of a pupil is published
            </Typography>
            <DetailText detail={gallery.consent} sx={{ color: "text.secondary" }} />
          </Box>
        </EmptyPanel>
      </Section>

      <CTABand
        heading="Would you like to see the school?"
        lead="A visit tells you more than any photograph. Families are welcome to come and look around."
        primaryLabel="Contact the office"
        primaryHref="/contact"
        secondaryLabel="Admissions"
        secondaryHref="/admissions"
      />
    </>
  );
}
