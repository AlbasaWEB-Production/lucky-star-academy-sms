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
// Run from the `web/` directory:
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
    "Missing Supabase env vars. Run from web/ with: node --env-file=.env.local scripts/seed.mjs",
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
// 3. Mirror role + school_id into admin app_metadata (what RLS reads)
// ---------------------------------------------------------------------------

await must(
  () =>
    admin.auth.admin.updateUserById(adminId, {
      app_metadata: { role: "admin", school_id: school.id, full_name: ADMIN.name },
    }),
  "Set admin app_metadata",
);

// ---------------------------------------------------------------------------
// 4. Admin profile row
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
// 5. Teacher auth users + profiles
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
// 6. Classes (Primary 1-6)
// ---------------------------------------------------------------------------

const { data: classes, error: classesError } = await admin
  .from("classes")
  .insert(CLASS_NAMES.map((name) => ({ school_id: school.id, name })))
  .select("id, name");
if (classesError || !classes) die(`Insert classes: ${classesError?.message}`);
const classIdByName = Object.fromEntries(classes.map((c) => [c.name, c.id]));

// ---------------------------------------------------------------------------
// 7. Subjects, each assigned to that class's teacher
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
// 8. Student auth users + profiles + students rows
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
// 9. Notices
// ---------------------------------------------------------------------------

await must(
  () => admin.from("notices").insert(NOTICES.map((n) => ({ ...n, school_id: school.id }))),
  "Insert notices",
);

// ---------------------------------------------------------------------------
// 10. A little sample exam results + attendance so the dashboards show data
// ---------------------------------------------------------------------------

// One sample student per class (the first of each class), 3 subjects each.
const sampleStudents = [0, 1, 2, 3, 4, 5].map((ci) => STUDENTS.find((s) => s.classIndex === ci && s.roll % 3 === 1) ?? STUDENTS[ci * 3]);

const examRows = [];
for (const s of sampleStudents) {
  const userId = studentIds[STUDENTS.indexOf(s)];
  for (const code of ["ENG", "MATH", "SCI"]) {
    const subjectId = subjectIdByClassAndCode[`${s.classIndex}:${code}`];
    if (!subjectId) continue;
    examRows.push({
      school_id: school.id,
      student_id: userId,
      subject_id: subjectId,
      marks_obtained: 55 + Math.floor(Math.random() * 45),
    });
  }
}
if (examRows.length) {
  await must(() => admin.from("exam_results").insert(examRows), "Insert sample exam results");
}

const attendanceRows = [];
for (const s of sampleStudents) {
  const userId = studentIds[STUDENTS.indexOf(s)];
  const classId = classIdByName[CLASS_NAMES[s.classIndex]];
  for (const code of ["ENG", "MATH"]) {
    const subjectId = subjectIdByClassAndCode[`${s.classIndex}:${code}`];
    if (!subjectId) continue;
    for (const date of ["2026-09-14", "2026-09-15"]) {
      attendanceRows.push({
        school_id: school.id,
        student_id: userId,
        subject_id: subjectId,
        class_id: classId,
        date,
        status: "Present",
      });
    }
  }
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
console.log(`Subjects:     ${SUBJECTS.length} per class`);
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
