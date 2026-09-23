import SiteNotFound from "@/components/site/SiteNotFound";

/**
 * The website's not-found page, for a `notFound()` thrown inside this group.
 *
 * A URL that matches no route at all does **not** come through here — a route
 * group adds no URL segment, so there is no group context to render in. That
 * case is handled by `src/app/not-found.tsx`, which renders the same component.
 */
export default function SiteGroupNotFound() {
  return <SiteNotFound />;
}
