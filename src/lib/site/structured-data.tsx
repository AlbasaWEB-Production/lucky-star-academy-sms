import { campuses, contact, META_DESCRIPTION, school, staff } from "@/content/site";
import { absoluteSiteUrl, SITE_ORIGIN } from "@/lib/site/host";

/**
 * The school as structured data.
 *
 * `School` is a real schema.org type (a subtype of `EducationalOrganization`),
 * which is what lets a search engine show the school's name, location, phone
 * number and staff as an entity rather than as anonymous text.
 *
 * **Only values the school has actually given us appear here.** Structured data
 * is read by machines that never see the "to be confirmed" marker on a page, so
 * a placeholder emitted here would be published as fact to every crawler that
 * reads the site — precisely the trap `DECISIONS.md` § 2 describes. The phone
 * numbers, the email, both campus addresses and the Admin and Finance Officer
 * are all supplied, so all of them are safe to state. The head teacher's name is
 * not, and `employee` filters it out rather than emitting a placeholder.
 */
export function schoolJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "School",
    name: school.name,
    description: META_DESCRIPTION,
    slogan: school.motto,
    foundingDate: school.founded,
    url: SITE_ORIGIN,
    logo: absoluteSiteUrl("/lucky_star_logo.png"),
    image: absoluteSiteUrl("/sms_background_image.png"),
    address: campuses.map((campus) => ({
      "@type": "PostalAddress",
      streetAddress: `${campus.name} Campus, ${campus.address}`,
      addressLocality: contact.town,
      addressRegion: contact.region,
      addressCountry: "GH",
    })),
    telephone: [contact.phone.value, contact.phoneAlt.value],
    email: contact.email.value,
    employee: staff.members
      .filter((member) => !member.name.pending)
      .map((member) => ({
        "@type": "Person",
        name: member.name.value,
        jobTitle: member.role,
      })),
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
