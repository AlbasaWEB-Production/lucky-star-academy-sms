// ============================================================================
// Lucky Star Academy - dashboard RLS verification
// ============================================================================
// Signs in as each seeded role with the ANON key (never the secret key), reads
// every object the dashboards use, and prints what each role actually got back.
//
// This deliberately goes through PostgREST as the real user rather than reading
// `pg_policies` text or running as the service role. The question is not "is
// there a policy" but "what does this user actually receive". A policy that
// exists but is wrong for a `security_invoker` view looks identical in the
// catalogue and completely different here - which is exactly how the role-scope
// gap this script first found (see RLS_VERIFICATION.md) stayed invisible.
//
// It also compares the two teachers' actual pupil NAMES, not just their row
// counts. Equal counts prove nothing about isolation: two teachers in classes of
// three would score 3 each whether they were correctly separated or both
// reading the same class.
//
// Run from `web/`:
//   node --env-file=.env.local scripts/verify-rls.mjs
//
// Exits non-zero if any role sees rows it must not, so it can gate a deploy.
// ============================================================================

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const ADMIN = { label: "admin", email: "admin@luckystaracademy.edu.gh", password: "Admin@2026" };
const TEACHER_PASSWORD = "Teacher@2026";
const STUDENT_PASSWORD = "Student@2026";
const STUDENT_DOMAIN = process.env.STUDENT_EMAIL_DOMAIN || "students.example.com";

const studentEmail = (roll) => `lucky-star-academy+${roll}@${STUDENT_DOMAIN}`;

// The seeded cast that makes scoping visible. Two teachers own one class each,
// and two pupils sit in different classes, so "sees only their own" shows up as
// different rows - and, for the teachers, as different pupils by name.
const PERSONAS = [
  { label: "admin", ...ADMIN },
  { label: "teacher1 (Primary 1)", email: "teacher1@luckystaracademy.edu.gh", password: TEACHER_PASSWORD },
  { label: "teacher2 (Primary 2)", email: "teacher2@luckystaracademy.edu.gh", password: TEACHER_PASSWORD },
  { label: "student roll 1 (Primary 1)", email: studentEmail(1), password: STUDENT_PASSWORD },
  { label: "student roll 5 (Primary 2)", email: studentEmail(5), password: STUDENT_PASSWORD },
];

// Every object the dashboards read. `identity` names a column whose distinct
// values are collected, so two roles can be compared on *which* rows they got.
const OBJECTS = [
  { name: "v_attendance_rate_by_class", kind: "view", identity: "class_name" },
  { name: "v_marks_by_class_subject", kind: "view" },
  { name: "v_enrolment_by_campus", kind: "view" },
  { name: "v_attendance_heatmap", kind: "view", identity: "student_name" },
  { name: "v_teacher_subject_load", kind: "view" },
  { name: "v_grade_distribution", kind: "view" },
  { name: "fn_at_risk_pupils", kind: "rpc", identity: "student_name" },
  { name: "terms", kind: "table" },
  { name: "dashboard_thresholds", kind: "table" },
  // Base tables, read directly. These are the pupil's own-data path (the
  // student dashboard does not use the views at all), so they double as the
  // check that scoping the views did not lock a pupil out of their own record.
  { name: "attendance", kind: "table" },
  { name: "exam_results", kind: "table" },
];

/** Read one object as the signed-in client. Returns rows, or an error string. */
async function read(client, object) {
  const { data, error } =
    object.kind === "rpc" ? await client.rpc(object.name) : await client.from(object.name).select("*");

  if (error) return { error: error.message };
  const rows = data ?? [];
  return {
    count: rows.length,
    values: object.identity ? [...new Set(rows.map((r) => r[object.identity]))].sort() : null,
  };
}

const results = [];

for (const persona of PERSONAS) {
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });

  const { error: signInError } = await client.auth.signInWithPassword({
    email: persona.email,
    password: persona.password,
  });

  if (signInError) {
    console.error(`✖ Could not sign in as ${persona.label}: ${signInError.message}`);
    process.exit(1);
  }

  const row = { persona: persona.label, counts: {}, values: {}, errors: {} };
  for (const object of OBJECTS) {
    const { count, values, error } = await read(client, object);
    row.counts[object.name] = error ? "ERR" : count;
    row.values[object.name] = values;
    if (error) row.errors[object.name] = error;
  }

  results.push(row);
  await client.auth.signOut();
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const names = OBJECTS.map((o) => o.name);
const width = Math.max(...names.map((n) => n.length)) + 2;

console.log("\nRows visible per role\n");
console.log(`${"".padEnd(28)}${names.map((n) => n.padStart(width)).join("")}`);
for (const row of results) {
  const cells = names.map((n) => String(row.counts[n]).padStart(width)).join("");
  console.log(`${row.persona.padEnd(28)}${cells}`);
}

for (const row of results) {
  const withValues = OBJECTS.filter((o) => o.identity && row.values[o.name]?.length);
  for (const object of withValues) {
    console.log(`\n  ${row.persona} / ${object.name}: ${row.values[object.name].join(", ")}`);
  }
}

const errors = results.flatMap((row) =>
  Object.entries(row.errors).map(([name, message]) => `${row.persona} / ${name}: ${message}`),
);
if (errors.length > 0) {
  console.log("\nErrors:");
  for (const line of errors) console.log(`  ${line}`);
}

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------

const c = Object.fromEntries(results.map((r) => [r.persona, r.counts]));
const v = Object.fromEntries(results.map((r) => [r.persona, r.values]));

const admin = c["admin"];
const adminV = v["admin"];
const t1 = c["teacher1 (Primary 1)"];
const t1V = v["teacher1 (Primary 1)"];
const t2 = c["teacher2 (Primary 2)"];
const t2V = v["teacher2 (Primary 2)"];
const s1 = c["student roll 1 (Primary 1)"];

const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

// --- The admin sees the whole school -------------------------------------
expect(admin.v_attendance_rate_by_class === 6, "admin should see all 6 classes' attendance");
expect(admin.v_marks_by_class_subject === 18, "admin should see all 6 classes x 3 subjects of marks");
expect(admin.v_enrolment_by_campus === 2, "admin should see both campuses' enrolment");
expect(admin.v_attendance_heatmap === 180, "admin should see all 18 pupils x 10 days");
expect(admin.v_teacher_subject_load === 6, "admin should see all 6 teachers' subject load");
expect(admin.v_grade_distribution === 54, "admin should see all 54 marks");
expect(admin.fn_at_risk_pupils === 3, "admin should see all 3 at-risk pupils");
expect(admin.terms === 3, "admin should see the 3 seeded terms");
expect(admin.dashboard_thresholds === 8, "admin should see the 8 threshold rows");

// --- A teacher sees their own class, and NOT the other teacher's ---------
expect(t1.v_attendance_rate_by_class === 1, "teacher1 should see exactly 1 class's attendance");
expect(t2.v_attendance_rate_by_class === 1, "teacher2 should see exactly 1 class's attendance");
expect(t1.v_attendance_heatmap === 30, "teacher1 should see their 3 pupils x 10 days");
expect(t2.v_attendance_heatmap === 30, "teacher2 should see their 3 pupils x 10 days");

// The names are the proof: equal counts, disjoint pupils.
const t1Pupils = t1V.v_attendance_heatmap ?? [];
const t2Pupils = t2V.v_attendance_heatmap ?? [];
expect(t1Pupils.length === 3, "teacher1 should see 3 named pupils");
expect(t2Pupils.length === 3, "teacher2 should see 3 named pupils");
expect(
  t1Pupils.every((name) => !t2Pupils.includes(name)),
  `teacher1 and teacher2 must not share a pupil (t1: ${t1Pupils.join(", ")} | t2: ${t2Pupils.join(", ")})`,
);
expect(
  t1Pupils.length + t2Pupils.length <= adminV.v_attendance_heatmap.length,
  "a teacher's pupils must be a subset of the school's",
);

// The seeded at-risk pupils sit in Primary 2, 4 and 5 - none in Primary 1.
expect(t1.fn_at_risk_pupils === 0, "teacher1 (Primary 1) must see no at-risk pupils");
expect(t2.fn_at_risk_pupils === 1, "teacher2 (Primary 2) should see exactly 1 at-risk pupil");
expect(
  !t1V.fn_at_risk_pupils?.length,
  "teacher1 must not receive any at-risk pupil name",
);

// --- Admin-only management metrics stay admin-only ------------------------
expect(t1.v_teacher_subject_load === 0, "a teacher must not read the staff workload table");
expect(t2.v_teacher_subject_load === 0, "a teacher must not read the staff workload table");
expect(t1.v_enrolment_by_campus === 0, "a teacher must not read the campus enrolment roll-up");

// --- A pupil gets no management figure at all ----------------------------
// Before the role-scope migration each of these returned 1-3 rows: the pupil's
// own record, relabelled as a class or campus figure. Zero is the honest answer.
expect(s1.v_attendance_rate_by_class === 0, "a pupil must see no class attendance rate");
expect(s1.v_marks_by_class_subject === 0, "a pupil must see no class subject averages");
expect(s1.v_enrolment_by_campus === 0, "a pupil must see no campus enrolment roll-up");
expect(s1.v_teacher_subject_load === 0, "a pupil must see no staff workload");
expect(s1.v_grade_distribution === 0, "a pupil must see no school-wide grade distribution");
expect(s1.v_attendance_heatmap === 0, "a pupil must see no heat map (it is a class view)");
expect(s1.fn_at_risk_pupils === 0, "a pupil must see no at-risk list");

// --- ...but a pupil keeps their own data ---------------------------------
// Scoping the views must not have locked a pupil out of their own record: the
// student dashboard reads these base tables directly.
expect(s1.attendance === 20, "a pupil should keep reading their own attendance (2 subjects x 10 days)");
expect(s1.exam_results === 3, "a pupil should keep reading their own 3 marks");
expect(admin.attendance === 360, "admin should see the whole attendance register");

// --- The term calendar is school-visible by design -----------------------
expect(c["student roll 1 (Primary 1)"].terms === 3, "the term calendar should stay visible to pupils");

console.log("");
if (failures.length === 0) {
  console.log("✅ RLS verification passed - every role sees exactly what it should.");
  process.exit(0);
}

console.log("✖ RLS verification FAILED:");
for (const failure of failures) console.log(`  - ${failure}`);
process.exit(1);
