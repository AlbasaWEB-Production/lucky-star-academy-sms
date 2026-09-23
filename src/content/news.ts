/**
 * News and announcements for the public website.
 *
 * **This list ships empty, on purpose.**
 *
 * The tempting alternative is to seed it with a few plausible-looking posts —
 * "Our 2025 speech day", a date, a photograph — so the page has something to
 * show. That is exactly the failure this codebase already documents in
 * `DECISIONS.md` § 2 and § 11: a placeholder that reads as real is
 * indistinguishable from real, and a parent who plans around an invented date
 * has been misled by us rather than by the school. An honest empty state costs
 * the school nothing and tells them precisely what to send.
 *
 * The page renders whatever is in this array. Adding the first announcement is
 * adding one object below — no code change.
 *
 * Follow-up worth doing once the client is happy (see `PLACEHOLDERS.md`):
 * notices already live in Supabase for the signed-in portal, so the office
 * could publish here from the admin portal they already use. That needs a new
 * anon-readable policy or view, and a deliberate decision about which notices
 * are public — so it is a change of its own, not a side effect of this one.
 */

export type NewsPost = {
  /** URL segment: `/news/<slug>`. Keep it lowercase and hyphenated. */
  slug: string;
  title: string;
  /** ISO `YYYY-MM-DD`. Rendered through `toLocaleDateString`. */
  date: string;
  /** One or two sentences shown in the list. */
  summary: string;
  /** Optional full body, one string per paragraph. */
  body?: readonly string[];
  /** Set to `false` once a post should stop appearing. */
  published?: boolean;
};

export const NEWS: readonly NewsPost[] = [];

/** Published posts, newest first. */
export function listNews(): readonly NewsPost[] {
  return [...NEWS]
    .filter((post) => post.published !== false)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Format an ISO date the way the rest of the app renders dates. */
export function formatNewsDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
