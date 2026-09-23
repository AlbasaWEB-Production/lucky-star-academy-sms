/**
 * The order a school's classes are presented in.
 *
 * Alphabetical order is wrong for a school. "KG 1" sorts before "Nursery 1",
 * and both sort before "Primary 1" — the exact reverse of how the school runs,
 * which is Nursery, then KG, then Primary, with the class number ordering
 * within each stage. Sorting by name puts a school's youngest class fourth and
 * its oldest fifth, and it reads as a bug to anyone who works there.
 *
 * THIS IS THE ONE DEFINITION of that order. Five helpers previously relied on
 * either a `.order("name")` from PostgREST or an `order by c.name` in a view,
 * and all of them got it wrong the same way. Add a new arranged list of classes
 * by sorting it here rather than reaching for the database's `order by`, because
 * PostgREST cannot order by a computed expression and there is no column on
 * `classes` that carries the progression.
 *
 * The views in `supabase/migrations` still carry their own `order by c.name`.
 * That is now presentation-irrelevant: every read below sorts in JS after
 * fetching, so the row order the views produce is no longer what any screen
 * shows. They are left alone deliberately, rather than redeclared, so the
 * progression is defined once instead of twice and cannot drift.
 */

/**
 * School stages in teaching order, youngest first.
 *
 * Matched on a normalised prefix. The list covers the stages a Ghanaian basic
 * school uses and is ordered by the ranking, not by these lines, so extending
 * it means choosing a rank that fits between its neighbours.
 */
const STAGES: readonly { pattern: RegExp; rank: number }[] = [
  { pattern: /^(cr[eè]che|day\s?care|play\s?group)/, rank: 0 },
  { pattern: /^nursery/, rank: 1 },
  { pattern: /^(reception|rec\b)/, rank: 2 },
  { pattern: /^(kg|k\.\s?g\.?|kindergarten)/, rank: 3 },
  { pattern: /^(primary|basic|pri\b)/, rank: 4 },
  { pattern: /^(jhs|junior)/, rank: 5 },
  { pattern: /^(shs|senior)/, rank: 6 },
];

/**
 * A stage the list above does not recognise sorts after every stage it does.
 *
 * Deliberately last rather than guessed into the middle: a name like "Year 3"
 * or "Blue Class" carries no evidence of where it sits in this school's
 * progression, and inventing a position for it would reorder the classes we do
 * know about around a guess.
 */
const UNRANKED = 99;

function stageRank(name: string): number {
  const normalised = name.trim().toLowerCase();

  for (const stage of STAGES) {
    if (stage.pattern.test(normalised)) {
      return stage.rank;
    }
  }

  return UNRANKED;
}

/**
 * The class number, or 0 when the name carries none.
 *
 * The first run of digits, so "Primary 10" ranks after "Primary 9" (which a
 * string comparison would get backwards) and "Primary 1A" is treated as
 * Primary 1.
 */
function classNumber(name: string): number {
  const match = name.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

/**
 * Orders two class names by school progression.
 *
 * Falls back to a plain comparison when a stage and number are equal — two
 * unranked names, say — so the result is a stable, predictable order rather
 * than whatever the previous sort happened to leave behind.
 */
export function compareClassNames(a: string, b: string): number {
  const byStage = stageRank(a) - stageRank(b);
  if (byStage !== 0) {
    return byStage;
  }

  const byNumber = classNumber(a) - classNumber(b);
  if (byNumber !== 0) {
    return byNumber;
  }

  return a.localeCompare(b);
}

/**
 * Orders rows that are presented campus first and class second.
 *
 * The analytics roll-ups are grouped by campus, so within a campus the classes
 * still need the school's order. A row with no campus sorts before the named
 * ones, which is how the campus-grouped screens already read.
 */
export function compareByCampusThenClass(
  a: { campus: string | null; className: string },
  b: { campus: string | null; className: string },
): number {
  return (a.campus ?? "").localeCompare(b.campus ?? "") || compareClassNames(a.className, b.className);
}
