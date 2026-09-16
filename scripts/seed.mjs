// ============================================================================
// Lucky Star Academy - seed script
// ============================================================================
// Pre-provisions the single school this system is built for, so nobody has to
// walk through the "Register your school" flow again.
//
// It writes everything with the Supabase admin client (secret key), which
// bypasses RLS - the same privilege `src/lib/supabase/admin.ts` uses for
// registration. The data is deliberately GENERIC / placeholder per the school
// owner: the structure (school, Primary 1-6 classes, primary subjects, roles,
// credentials) is what matters, not real student records.
//
// Run from the project root:
//   node --env-file=.env.local scripts/seed.mjs
//
// It aborts (leaving the DB untouched) if the school already exists, so it is
// safe to run again after a partial failure only if you delete the school row
// and auth users first.
// ============================================================================

import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const studentEmailDomain = process.env.STUDENT_EMAIL_DOMAIN || "students.example.com";

if (!url || !secret) {
  throw new Error(
    "Missing Supabase env vars. Run from the project root with: node --env-file=.env.local scripts/seed.mjs",
  );
}

const admin = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

// ---------------------------------------------------------------------------
// Seed configuration (generic / placeholder data)
// ---------------------------------------------------------------------------

const SCHOOL = { name: "Lucky Star Academy", slug: "lucky-star-academy" };

// PRIMARY-ONLY school: Primary 1-6. No JHS, no SHS.
const CLASS_NAMES = ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"];

// The school's two campuses, one per class (school fact). Primary 1-3 are at
// Nayilifong, Primary 4-6 at Kpatuya.
const CLASS_CAMPUSES = [
  "Nayilifong",
  "Nayilifong",
  "Nayilifong",
  "Kpatuya",
  "Kpatuya",
  "Kpatuya",
];

// The school's three-term calendar for 2026/2027 (school fact). First Term must
// contain the sampled attendance days built in section 11, or the term-scoped
// reads - the at-risk rule and the heat map - would look at a window with no
// attendance in it and every figure would read as an absence of data rather
// than a real number.
const TERMS = [
  { name: "First Term 2026/2027", termNumber: 1, startDate: "2026-09-01", endDate: "2026-12-18" },
  { name: "Second Term 2026/2027", termNumber: 2, startDate: "2027-01-05", endDate: "2027-04-02" },
  { name: "Third Term 2026/2027", termNumber: 3, startDate: "2027-04-20", endDate: "2027-07-23" },
];

// The school's own dashboard thresholds - the numbers it judges pupils by.
//
// These are seeded as real rows rather than left to the fallbacks compiled into
// the app and the SQL. An empty config table means the school has configured
// nothing and every metric is quietly running on a developer's default, which
// is indistinguishable on screen from a decision the head actually made.
// Seeded at the documented defaults so the two agree until someone edits them.
const THRESHOLDS = [
  { key: "at_risk_attendance_percent", value: "80" },
  { key: "at_risk_subject_min_mark", value: "40" },
  { key: "at_risk_min_subjects", value: "2" },
  { key: "grade_A_min", value: "80" },
  { key: "grade_B_min", value: "70" },
  { key: "grade_C_min", value: "60" },
  { key: "grade_D_min", value: "50" },
  { key: "grade_E_min", value: "40" },
];

// Standard Ghanaian basic-school subjects, same set for every class.
const SUBJECTS = [
  { name: "English Language", code: "ENG", sessions: "5" },
  { name: "Mathematics", code: "MATH", sessions: "5" },
  { name: "Science", code: "SCI", sessions: "5" },
  { name: "Ghanaian Language", code: "GHL", sessions: "4" },
  { name: "Information & Communication Technology", code: "ICT", sessions: "2" },
  { name: "Social Studies", code: "SST", sessions: "3" },
  { name: "Religious & Moral Education", code: "RME", sessions: "3" },
  { name: "Creative Arts", code: "CRA", sessions: "3" },
  { name: "Physical Education", code: "PE", sessions: "2" },
];

const ADMIN = {
  name: "School Administrator",
  email: "admin@luckystaracademy.edu.gh",
  password: "Admin@2026",
};

// One class teacher per class (Primary 1-6). Each teaches all subjects in
// their class, which is the typical arrangement in a primary school.
const TEACHERS = [
  { name: "Ama Mensah", email: "teacher1@luckystaracademy.edu.gh" },
  { name: "Kofi Owusu", email: "teacher2@luckystaracademy.edu.gh" },
  { name: "Efua Boateng", email: "teacher3@luckystaracademy.edu.gh" },
  { name: "Yaw Adjei", email: "teacher4@luckystaracademy.edu.gh" },
  { name: "Akosua Asante", email: "teacher5@luckystaracademy.edu.gh" },
  { name: "Kwame Darko", email: "teacher6@luckystaracademy.edu.gh" },
];
const TEACHER_PASSWORD = "Teacher@2026";

// Three students per class, roll numbers unique per school (1..18).
const STUDENTS = [
  { name: "Ama Serwaa", classIndex: 0, roll: 1 },
  { name: "Kofi Mensah", classIndex: 0, roll: 2 },
  { name: "Efua Naa", classIndex: 0, roll: 3 },
  { name: "Yaw Boakye", classIndex: 1, roll: 4 },
  { name: "Akosua Bonsu", classIndex: 1, roll: 5 },
  { name: "Kwame Asante", classIndex: 1, roll: 6 },
  { name: "Adwoa Owusu", classIndex: 2, roll: 7 },
  { name: "Kojo Appiah", classIndex: 2, roll: 8 },
  { name: "Abena Sarpong", classIndex: 2, roll: 9 },
  { name: "Nana Ama", classIndex: 3, roll: 10 },
  { name: "Kwesi Boateng", classIndex: 3, roll: 11 },
  { name: "Esi Nyarko", classIndex: 3, roll: 12 },
  { name: "Fiifi Andoh", classIndex: 4, roll: 13 },
  { name: "Araba Tetteh", classIndex: 4, roll: 14 },
  { name: "Kweku Ansah", classIndex: 4, roll: 15 },
  { name: "Aku Sika", classIndex: 5, roll: 16 },
  { name: "Kwabena Osei", classIndex: 5, roll: 17 },
  { name: "Maame Yaa", classIndex: 5, roll: 18 },
];
const STUDENT_PASSWORD = "Student@2026";

const NOTICES = [
  { title: "Welcome to the new term", details: "Classes resume on Monday. All pupils should report with their books and school uniform." },
  { title: "Parents' meeting", details: "A general parents' meeting holds this Friday at 9:00am in the school hall. Attendance is strongly encouraged." },
  { title: "Inter-school sports day", details: "The annual inter-school sports day takes place next month. Interested pupils should register with their class teacher." },
];

const studentEmail = (roll) => `${SCHOOL.slug}+${roll}@${studentEmailDomain}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function die(message) {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

async function must(fn, label) {
  const { error } = await fn();
  if (error) die(`${label}: ${error.message}`);
}

async function selectSingle(qb, label) {
  const { data, error } = await qb.single();
  if (error) die(`${label}: ${error.message}`);
  return data;
}

// ---------------------------------------------------------------------------
// 0. Guard against re-running on an already-seeded project
// ---------------------------------------------------------------------------

const RESET = process.argv.includes("--reset");

// Every auth-user email this seed creates (admin, teachers, students).
const seededEmails = new Set([
  ADMIN.email,
  ...TEACHERS.map((t) => t.email),
  ...STUDENTS.map((s) => studentEmail(s.roll)),
]);

async function removeSeededData() {
  // Delete auth users first: profiles cascade from auth.users, and students,
  // exam_results and attendance cascade from profiles - so this clears the
  // tenant's people and their records in one pass.
  const { data: page, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) die(`List users: ${listError.message}`);
  for (const u of page?.users ?? []) {
    if (seededEmails.has(u.email)) {
      const { error: delError } = await admin.auth.admin.deleteUser(u.id);
      if (delError) die(`Delete user ${u.email}: ${delError.message}`);
    }
  }

  // Then the school row, which cascades to classes, subjects, notices, etc.
  const { error: schoolError } = await admin.from("schools").delete().eq("slug", SCHOOL.slug);
  if (schoolError) die(`Delete school: ${schoolError.message}`);
}

if (RESET) {
  console.log("Resetting previously seeded data ...");
  await removeSeededData();
}

const { data: existingSchool } = await admin
  .from("schools")
  .select("id")
  .eq("slug", SCHOOL.slug)
  .maybeSingle();
if (existingSchool) {
  die(
    `School "${SCHOOL.slug}" already exists. Re-run with --reset to wipe and reseed, or delete it manually.`,
  );
}

console.log(`\nSeeding ${SCHOOL.name} (${SCHOOL.slug}) ...\n`);

// ---------------------------------------------------------------------------
// 1. Admin auth user (no school_id yet - created before the school row, like
//    registerSchoolAction does)
// ---------------------------------------------------------------------------

const { data: adminCreated, error: adminCreateError } = await admin.auth.admin.createUser({
  email: ADMIN.email,
  password: ADMIN.password,
  email_confirm: true,
  app_metadata: { role: "admin", full_name: ADMIN.name },
});
if (adminCreateError || !adminCreated?.user) die(`Create admin: ${adminCreateError?.message ?? "unknown error"}`);
const adminId = adminCreated.user.id;

// ---------------------------------------------------------------------------
// 2. The school (the tenant)
// ---------------------------------------------------------------------------

const school = await selectSingle(
  admin.from("schools").insert({ name: SCHOOL.name, slug: SCHOOL.slug, created_by: adminId }).select("id"),
  "Insert school",
);

// ---------------------------------------------------------------------------
// 3. Term calendar + dashboard thresholds (the school's own configuration)
// ---------------------------------------------------------------------------

await must(
  () =>
    admin.from("terms").insert(
      TERMS.map((t) => ({
        school_id: school.id,
        name: t.name,
        term_number: t.termNumber,
        start_date: t.startDate,
        end_date: t.endDate,
      })),
    ),
  "Insert term calendar",
);

await must(
  () =>
    admin.from("dashboard_thresholds").insert(
      THRESHOLDS.map((t) => ({ school_id: school.id, key: t.key, value: t.value })),
    ),
  "Insert dashboard thresholds",
);

// ---------------------------------------------------------------------------
// 4. Mirror role + school_id into admin app_metadata (what RLS reads)
// ---------------------------------------------------------------------------

await must(
  () =>
    admin.auth.admin.updateUserById(adminId, {
      app_metadata: { role: "admin", school_id: school.id, full_name: ADMIN.name },
    }),
  "Set admin app_metadata",
);

// ---------------------------------------------------------------------------
// 5. Admin profile row
// ---------------------------------------------------------------------------

await must(
  () =>
    admin.from("profiles").insert({
      id: adminId,
      school_id: school.id,
      role: "admin",
      full_name: ADMIN.name,
      email: ADMIN.email,
    }),
  "Insert admin profile",
);

// ---------------------------------------------------------------------------
// 6. Teacher auth users + profiles
// ---------------------------------------------------------------------------

const teacherIds = [];
for (const t of TEACHERS) {
  const { data: created, error } = await admin.auth.admin.createUser({
    email: t.email,
    password: TEACHER_PASSWORD,
    email_confirm: true,
    app_metadata: { role: "teacher", school_id: school.id, full_name: t.name },
  });
  if (error || !created?.user) die(`Create teacher ${t.email}: ${error?.message ?? "unknown error"}`);
  const teacherId = created.user.id;
  teacherIds.push(teacherId);

  await must(
    () =>
      admin.from("profiles").insert({
        id: teacherId,
        school_id: school.id,
        role: "teacher",
        full_name: t.name,
        email: t.email,
      }),
    `Insert teacher profile ${t.email}`,
  );
}

// ---------------------------------------------------------------------------
// 7. Classes (Primary 1-6)
// ---------------------------------------------------------------------------

// Campus assignment is one of the school's own facts, so it is set here rather
// than left to a one-off migration backfill: re-running this seed must not
// silently wipe which campus a class belongs to.
const { data: classes, error: classesError } = await admin
  .from("classes")
  .insert(
    CLASS_NAMES.map((name, index) => ({
      school_id: school.id,
      name,
      campus: CLASS_CAMPUSES[index],
    })),
  )
  .select("id, name");
if (classesError || !classes) die(`Insert classes: ${classesError?.message}`);
const classIdByName = Object.fromEntries(classes.map((c) => [c.name, c.id]));

// ---------------------------------------------------------------------------
// 8. Subjects, each assigned to that class's teacher
// ---------------------------------------------------------------------------

const subjectRows = [];
for (let ci = 0; ci < CLASS_NAMES.length; ci += 1) {
  for (const s of SUBJECTS) {
    subjectRows.push({
      school_id: school.id,
      class_id: classIdByName[CLASS_NAMES[ci]],
      teacher_id: teacherIds[ci],
      name: s.name,
      code: s.code,
      sessions: s.sessions,
    });
  }
}

const { data: subjects, error: subjectsError } = await admin
  .from("subjects")
  .insert(subjectRows)
  .select("id, class_id, name, code");
if (subjectsError || !subjects) die(`Insert subjects: ${subjectsError?.message}`);

// Index subjects for later exam/attendance seeding: [classIndex][code] -> id
const subjectIdByClassAndCode = {};
for (const sub of subjects) {
  const classIndex = CLASS_NAMES.findIndex((name) => classIdByName[name] === sub.class_id);
  subjectIdByClassAndCode[`${classIndex}:${sub.code}`] = sub.id;
}

// ---------------------------------------------------------------------------
// 9. Student auth users + profiles + students rows
// ---------------------------------------------------------------------------

const studentIds = [];
for (const s of STUDENTS) {
  const email = studentEmail(s.roll);
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: STUDENT_PASSWORD,
    email_confirm: true,
    app_metadata: { role: "student", school_id: school.id, full_name: s.name },
  });
  if (error || !created?.user) die(`Create student ${s.name} (${email}): ${error?.message ?? "unknown error"}`);
  const studentId = created.user.id;
  studentIds.push(studentId);

  await must(
    () =>
      admin.from("profiles").insert({
        id: studentId,
        school_id: school.id,
        role: "student",
        full_name: s.name,
        email,
      }),
    `Insert student profile ${email}`,
  );

  await must(
    () =>
      admin.from("students").insert({
        id: studentId,
        school_id: school.id,
        class_id: classIdByName[CLASS_NAMES[s.classIndex]],
        roll_number: s.roll,
      }),
    `Insert student ${email}`,
  );
}

// ---------------------------------------------------------------------------
// 10. Notices
// ---------------------------------------------------------------------------

await must(
  () => admin.from("notices").insert(NOTICES.map((n) => ({ ...n, school_id: school.id }))),
  "Insert notices",
);

// ---------------------------------------------------------------------------
// 11. Sample attendance + marks, so the dashboards have something real to read
// ---------------------------------------------------------------------------
// Deterministic, deliberately NOT random: every run produces the same dataset,
// so a screenshot, an RLS check or a bug report is reproducible.
//
// The shape is uneven on purpose. A dataset that is all-Present and all-70%
// renders every attendance widget at a flat 100% and leaves the at-risk list
// permanently empty - which is exactly the state a real school is never in, and
// which would let a broken dashboard look correct. So most pupils attend well,
// a few do not, and a few are weak in two subjects.

// The first ten school days of First Term, skipping weekends. Every date here
// falls inside the term window, so term-scoped reads (the at-risk rule) see
// these rows. Built with UTC accessors so the dates cannot shift by a day on a
// machine in a negative-offset timezone.
const SCHOOL_DAYS = [];
for (let d = new Date(Date.UTC(2026, 8, 8)); SCHOOL_DAYS.length < 10; d.setUTCDate(d.getUTCDate() + 1)) {
  const weekday = d.getUTCDay();
  if (weekday !== 0 && weekday !== 6) SCHOOL_DAYS.push(d.toISOString().slice(0, 10));
}

// Pupils below the default at-risk bars: under 40 in English and Mathematics
// (the two subjects attendance is taken in), and under 80% attendance. They are
// spread across three classes and both campuses, so no single class looks like
// the problem.
const STRUGGLING_ROLLS = new Set([5, 11, 14]);

/** Mark for a pupil in a subject. Spreads across 32..96 so every band A-F appears. */
function markFor(roll, subjectIndex) {
  if (STRUGGLING_ROLLS.has(roll)) {
    return 28 + subjectIndex * 6; // 28, 34, 40 - below 40 in the first two
  }
  return 32 + ((roll * 17 + subjectIndex * 29) % 65);
}

/**
 * Whether a pupil missed a given school day.
 *
 * The struggling pupils miss four days in ten (60% attendance, under the 80%
 * rule). Everyone else misses the odd day via a stride that does not line up
 * with the week, so no class reads a suspiciously tidy 100% - but never more
 * than two days, which keeps them above the rule and out of the at-risk list.
 */
function isAbsent(roll, dayIndex) {
  if (STRUGGLING_ROLLS.has(roll)) {
    return dayIndex % 5 === 2 || dayIndex % 7 === 3 || dayIndex === 8;
  }
  return (roll + dayIndex) % 9 === 0;
}

const EXAM_CODES = ["ENG", "MATH", "SCI"];
// Attendance is taken in the two subjects a class meets every day.
const REGISTER_CODES = ["ENG", "MATH"];

const examRows = [];
const attendanceRows = [];

STUDENTS.forEach((s, studentIndex) => {
  const userId = studentIds[studentIndex];
  const classId = classIdByName[CLASS_NAMES[s.classIndex]];

  EXAM_CODES.forEach((code, subjectIndex) => {
    const subjectId = subjectIdByClassAndCode[`${s.classIndex}:${code}`];
    if (!subjectId) return;
    examRows.push({
      school_id: school.id,
      student_id: userId,
      subject_id: subjectId,
      marks_obtained: markFor(s.roll, subjectIndex),
    });
  });

  for (const code of REGISTER_CODES) {
    const subjectId = subjectIdByClassAndCode[`${s.classIndex}:${code}`];
    if (!subjectId) continue;
    SCHOOL_DAYS.forEach((date, dayIndex) => {
      attendanceRows.push({
        school_id: school.id,
        student_id: userId,
        subject_id: subjectId,
        class_id: classId,
        date,
        status: isAbsent(s.roll, dayIndex) ? "Absent" : "Present",
      });
    });
  }
});

if (examRows.length) {
  await must(() => admin.from("exam_results").insert(examRows), "Insert sample exam results");
}
if (attendanceRows.length) {
  await must(() => admin.from("attendance").insert(attendanceRows), "Insert sample attendance");
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log("\n✅ Seed complete.\n");
console.log(`School:       ${SCHOOL.name} (${SCHOOL.slug})`);
console.log(`Classes:      ${CLASS_NAMES.join(", ")}`);
console.log(
  `Campuses:     ${CLASS_NAMES.map((name, i) => `${name}→${CLASS_CAMPUSES[i]}`).join(", ")}`,
);
console.log(`Subjects:     ${SUBJECTS.length} per class`);
console.log(`Terms:        ${TERMS.map((t) => t.name).join(", ")}`);
console.log(`Thresholds:   ${THRESHOLDS.length} dashboard config rows`);
console.log(`Teachers:     ${TEACHERS.length}`);
console.log(`Students:     ${STUDENTS.length}`);
console.log("");
console.log("Sign-in credentials (generic / placeholder):");
console.log(`  Admin    ${ADMIN.email} / ${ADMIN.password}`);
for (const t of TEACHERS) console.log(`  Teacher  ${t.email} / ${TEACHER_PASSWORD}`);
console.log(`  Students roll + name / ${STUDENT_PASSWORD}`);
for (const s of STUDENTS.slice(0, 3)) {
  console.log(`    roll ${s.roll}  ${s.name}`);
}
console.log(`  (all 18 students share the password; each logs in with roll + name)`);
console.log("");
