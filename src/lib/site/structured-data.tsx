import { school, contact } from "@/content/site";
import { absoluteSiteUrl, SITE_ORIGIN } from "@/lib/site/host";

/**
 * The school as structured data.
 *
 * `School` is a real schema.org type (a subtype of `EducationalOrganization`),
 * which is what lets a search engine show the school's name, location and motto
 * as an entity rather than as anonymous text.
 *
 * **Only values the school has actually given us appear here.** There is no
 * `telephone`, no `streetAddress` and no `email`, because those are still
 * pending — and structured data is read by machines that do not see the
 * "to be confirmed" marker on the page. Emitting a placeholder phone number
 * here would publish it as fact to every crawler that reads the site, which is
 * precisely the trap `DECISIONS.md` § 2 describes.
 *
 * Adding the fields is a one-line change once the real values arrive.
 */
export function schoolJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "School",
    name: school.name,
    description: `A ${school.levels} school in ${school.town}, ${school.region}, Ghana. Established ${school.founded}.`,
    slogan: school.motto,
    foundingDate: school.founded,
    url: SITE_ORIGIN,
    logo: absoluteSiteUrl("/lucky_star_logo.png"),
    image: absoluteSiteUrl("/sms_background_image.png"),
    address: {
      "@type": "PostalAddress",
      addressLocality: contact.town,
      addressRegion: contact.region,
      addressCountry: "GH",
    },
  };
}

/**
 * Renders a JSON-LD block.
 *
 * `JSON.stringify` output is escaped for the `<script>` context by replacing the
 * two sequences that can terminate it early — without that, a `</script>` or an
 * HTML comment inside any string would break out of the element.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data)
          .replace(/</g, "\\u003c")
          .replace(/>/g, "\\u003e")
          .replace(/&/g, "\\u0026"),
      }}
    />
  );
}
