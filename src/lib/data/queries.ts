import "server-only";

import { compareClassNames } from "@/lib/class-order";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Read layer.
 *
 * Every function here relies on Row Level Security for scoping rather than
 * adding its own `where school_id = ...`. That is deliberate:
 *
 *   - It cannot be forgotten. A query written without a tenant filter is
 *     still correct, which removes the most common way multi-tenant apps leak
 *     data.
 *   - The same function returns the right rows for every role without
 *     branching. `listStudents()` returns the whole school for an admin, only
 *     the classes they teach for a teacher, and a single row for a student,
 *     because that is what the policies allow.
 *
 * Column lists are explicit, and related names are resolved with a second
 * batched query instead of PostgREST embedding. Embedding is fine, but it
 * depends on the generated `Relationships` metadata that this project's
 * hand-written database.types.ts does not yet include.
 */

// ---------------------------------------------------------------------------
// View models
// ---------------------------------------------------------------------------

export type StudentSummary = {
  id: string;
  fullName: string;
  email: string | null;
  rollNumber: number;
  classId: string;
  className: string;
};

export type SubjectSummary = {
  id: string;
  name: string;
  code: string;
  sessions: string;
  classId: string;
  className: string;
  teacherId: string | null;
  teacherName: string | null;
};

export type TeacherAssignment = {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  classId: string;
  className: string;
};

export type TeacherSummary = {
  id: string;
  fullName: string;
  email: string | null;
  assignments: TeacherAssignment[];
};

export type NoticeSummary = {
  id: string;
  title: string;
  details: string;
  date: string;
};

export type ComplaintSummary = {
  id: string;
  complaint: string;
  date: string;
  studentId: string;
  studentName: string;
};

export type ExamResultEntry = {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  marksObtained: number;
};

export type AttendanceRecord = {
  id: string;
  date: string;
  status: "Present" | "Absent";
  subjectId: string;
  subjectName: string;
};

export type SubjectAttendanceSummary = {
  subjectId: string;
  subjectName: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
};

export type DashboardStats = {
  students: number;
  teachers: number;
  admins: number;
  classes: number;
  subjects: number;
  notices: number;
  complaints: number;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

async function namesByIds(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) {
    return new Map();
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("id, full_name").in("id", unique(ids));

  return new Map((data ?? []).map((row) => [row.id, row.full_name]));
}

async function classNamesByIds(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) {
    return new Map();
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("classes").select("id, name").in("id", unique(ids));

  return new Map((data ?? []).map((row) => [row.id, row.name]));
}

// ---------------------------------------------------------------------------
// School
// ---------------------------------------------------------------------------

export async function getSchool(schoolId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("schools")
    .select("id, name, slug")
    .eq("id", schoolId)
    .maybeSingle();

  return data;
}

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

export type ClassSummary = {
  id: string;
  name: string;
  studentCount: number;
  subjectCount: number;
};

export async function listClasses(): Promise<ClassSummary[]> {
  const supabase = await createSupabaseServerClient();

  // Fetched unordered and sorted below: PostgREST cannot order by a computed
  // expression, and `order("name")` put KG before Nursery. See
  // `@/lib/class-order` for why the progression is not alphabetical.
  const { data: classes } = await supabase.from("classes").select("id, name");

  if (!classes || classes.length === 0) {
    return [];
  }

  classes.sort((a, b) => compareClassNames(a.name, b.name));

  const classIds = classes.map((row) => row.id);

  // Two batched counts instead of a per-class query loop.
  const [{ data: students }, { data: subjects }] = await Promise.all([
    supabase.from("students").select("class_id").in("class_id", classIds),
    supabase.from("subjects").select("class_id").in("class_id", classIds),
  ]);

  const studentCounts = new Map<string, number>();
  for (const row of students ?? []) {
    studentCounts.set(row.class_id, (studentCounts.get(row.class_id) ?? 0) + 1);
  }

  const subjectCounts = new Map<string, number>();
  for (const row of subjects ?? []) {
    subjectCounts.set(row.class_id, (subjectCounts.get(row.class_id) ?? 0) + 1);
  }

  return classes.map((row) => ({
    id: row.id,
    name: row.name,
    studentCount: studentCounts.get(row.id) ?? 0,
    subjectCount: subjectCounts.get(row.id) ?? 0,
  }));
}

export async function getClassById(classId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("classes")
    .select("id, name, capacity")
    .eq("id", classId)
    .maybeSingle();

  return data;
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

/**
 * Reads the student_directory view, which already joins students, profiles,
 * classes and schools. One query instead of four round trips.
 */
export async function listStudents(): Promise<StudentSummary[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("student_directory")
    .select("student_id, full_name, email, roll_number, class_id, class_name")
    .order("class_name")
    .order("roll_number");

  return (data ?? []).map((row) => ({
    id: row.student_id,
    fullName: row.full_name,
    email: row.email,
    rollNumber: row.roll_number,
    classId: row.class_id,
    className: row.class_name,
  }));
}

export async function listStudentsByClass(classId: string): Promise<StudentSummary[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("student_directory")
    .select("student_id, full_name, email, roll_number, class_id, class_name")
    .eq("class_id", classId)
    .order("roll_number");

  return (data ?? []).map((row) => ({
    id: row.student_id,
    fullName: row.full_name,
    email: row.email,
    rollNumber: row.roll_number,
    classId: row.class_id,
    className: row.class_name,
  }));
}

export async function getStudentById(studentId: string): Promise<StudentSummary | null> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("student_directory")
    .select("student_id, full_name, email, roll_number, class_id, class_name")
    .eq("student_id", studentId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    id: data.student_id,
    fullName: data.full_name,
    email: data.email,
    rollNumber: data.roll_number,
    classId: data.class_id,
    className: data.class_name,
  };
}

/** The signed-in student's own record, or null for other roles. */
export async function getOwnStudentRecord(userId: string): Promise<StudentSummary | null> {
  return getStudentById(userId);
}

// ---------------------------------------------------------------------------
// Subjects
// ---------------------------------------------------------------------------

export async function listSubjects(): Promise<SubjectSummary[]> {
  const supabase = await createSupabaseServerClient();

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, code, sessions, class_id, teacher_id")
    .order("name");

  if (!subjects || subjects.length === 0) {
    return [];
  }

  const [classes, teacherNames] = await Promise.all([
    classNamesByIds(subjects.map((row) => row.class_id)),
    namesByIds(subjects.flatMap((row) => (row.teacher_id ? [row.teacher_id] : []))),
  ]);

  return subjects.map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    sessions: row.sessions,
    classId: row.class_id,
    className: classes.get(row.class_id) ?? "Unknown class",
    teacherId: row.teacher_id,
    teacherName: row.teacher_id ? (teacherNames.get(row.teacher_id) ?? "Unknown teacher") : null,
  }));
}

export async function listSubjectsByClass(classId: string): Promise<SubjectSummary[]> {
  const all = await listSubjects();
  return all.filter((subject) => subject.classId === classId);
}

/** Subjects in a class that have no teacher yet - used by the assignment picker. */
export async function listUnassignedSubjects(classId: string): Promise<SubjectSummary[]> {
  const all = await listSubjectsByClass(classId);
  return all.filter((subject) => subject.teacherId === null);
}

export async function getSubjectById(subjectId: string): Promise<SubjectSummary | null> {
  const all = await listSubjects();
  return all.find((subject) => subject.id === subjectId) ?? null;
}

// ---------------------------------------------------------------------------
// Teachers
// ---------------------------------------------------------------------------

export async function listTeachers(): Promise<TeacherSummary[]> {
  const supabase = await createSupabaseServerClient();

  const { data: teachers } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "teacher")
    .order("full_name");

  if (!teachers || teachers.length === 0) {
    return [];
  }

  const teacherIds = teachers.map((row) => row.id);

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, code, class_id, teacher_id")
    .in("teacher_id", teacherIds);

  const classNames = await classNamesByIds((subjects ?? []).map((row) => row.class_id));

  const assignmentsByTeacher = new Map<string, TeacherAssignment[]>();

  for (const subject of subjects ?? []) {
    if (!subject.teacher_id) {
      continue;
    }
    const list = assignmentsByTeacher.get(subject.teacher_id) ?? [];
    list.push({
      subjectId: subject.id,
      subjectName: subject.name,
      subjectCode: subject.code,
      classId: subject.class_id,
      className: classNames.get(subject.class_id) ?? "Unknown class",
    });
    assignmentsByTeacher.set(subject.teacher_id, list);
  }

  return teachers.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    assignments: assignmentsByTeacher.get(row.id) ?? [],
  }));
}

export async function getTeacherById(teacherId: string): Promise<TeacherSummary | null> {
  const all = await listTeachers();
  return all.find((teacher) => teacher.id === teacherId) ?? null;
}

export type AdminSummary = {
  id: string;
  fullName: string;
  email: string | null;
};

/** Administrator profiles, read-only. RLS scopes to the caller's school. */
export async function listAdmins(): Promise<AdminSummary[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "admin")
    .order("full_name");

  return (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
  }));
}

export type OfficeStaffSummary = {
  id: string;
  fullName: string;
  email: string | null;
  role: "accountant" | "schedule_officer";
};

/**
 * The two non-teaching, non-administrator staff roles, in one list.
 *
 * They are listed together rather than as two pages because they are the same
 * kind of account - created by the school office, signed in with an email
 * address, and holding a narrow slice of school data - and because neither is
 * expected to number more than a handful. RLS scopes the rows to the caller's
 * school, like every other read here.
 */
export async function listOfficeStaff(): Promise<OfficeStaffSummary[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .in("role", ["accountant", "schedule_officer"])
    .order("full_name");

  return (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    // The `.in()` above is the only filter, so the column can only hold these
    // two values; the cast records that rather than widening the type to the
    // whole enum and forcing every caller to re-narrow it.
    role: row.role as OfficeStaffSummary["role"],
  }));
}

/** The signed-in teacher's own assignments. */
export async function getOwnTeacherAssignments(teacherId: string): Promise<TeacherAssignment[]> {
  const supabase = await createSupabaseServerClient();

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, code, class_id")
    .eq("teacher_id", teacherId)
    .order("name");

  if (!subjects || subjects.length === 0) {
    return [];
  }

  const classNames = await classNamesByIds(subjects.map((row) => row.class_id));

  return subjects.map((row) => ({
    subjectId: row.id,
    subjectName: row.name,
    subjectCode: row.code,
    classId: row.class_id,
    className: classNames.get(row.class_id) ?? "Unknown class",
  }));
}

// ---------------------------------------------------------------------------
// Notices
// ---------------------------------------------------------------------------

export async function listNotices(): Promise<NoticeSummary[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("notices")
    .select("id, title, details, date")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getNoticeById(noticeId: string): Promise<NoticeSummary | null> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("notices")
    .select("id, title, details, date")
    .eq("id", noticeId)
    .maybeSingle();

  return data ?? null;
}

// ---------------------------------------------------------------------------
// Complaints
// ---------------------------------------------------------------------------

export async function listComplaints(): Promise<ComplaintSummary[]> {
  const supabase = await createSupabaseServerClient();

  const { data: complaints } = await supabase
    .from("complaints")
    .select("id, complaint, date, student_id")
    .order("date", { ascending: false });

  if (!complaints || complaints.length === 0) {
    return [];
  }

  const names = await namesByIds(complaints.map((row) => row.student_id));

  return complaints.map((row) => ({
    id: row.id,
    complaint: row.complaint,
    date: row.date,
    studentId: row.student_id,
    studentName: names.get(row.student_id) ?? "Unknown student",
  }));
}

// ---------------------------------------------------------------------------
// Exam results
// ---------------------------------------------------------------------------

export async function listExamResultsForStudent(studentId: string): Promise<ExamResultEntry[]> {
  const supabase = await createSupabaseServerClient();

  const { data: results } = await supabase
    .from("exam_results")
    .select("subject_id, marks_obtained")
    .eq("student_id", studentId);

  if (!results || results.length === 0) {
    return [];
  }

  const subjectIds = results.map((row) => row.subject_id);

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, code")
    .in("id", subjectIds);

  const subjectById = new Map((subjects ?? []).map((row) => [row.id, row]));

  return results.map((row) => {
    const subject = subjectById.get(row.subject_id);
    return {
      subjectId: row.subject_id,
      subjectName: subject?.name ?? "Unknown subject",
      subjectCode: subject?.code ?? "-",
      marksObtained: row.marks_obtained,
    };
  });
}

export type RecentExamResult = {
  subjectId: string;
  subjectName: string;
  marksObtained: number;
  recordedAt: string;
};

/** Exam results recorded since `since` (an ISO timestamp), newest first. */
export async function listRecentExamResultsForStudent(
  studentId: string,
  since: string,
): Promise<RecentExamResult[]> {
  const supabase = await createSupabaseServerClient();

  const { data: results } = await supabase
    .from("exam_results")
    .select("subject_id, marks_obtained, created_at")
    .eq("student_id", studentId)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (!results || results.length === 0) {
    return [];
  }

  const subjectIds = unique(results.map((row) => row.subject_id));
  const { data: subjects } = await supabase.from("subjects").select("id, name").in("id", subjectIds);
  const subjectNames = new Map((subjects ?? []).map((row) => [row.id, row.name]));

  return results.map((row) => ({
    subjectId: row.subject_id,
    subjectName: subjectNames.get(row.subject_id) ?? "Unknown subject",
    marksObtained: row.marks_obtained,
    recordedAt: row.created_at,
  }));
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export async function listAttendanceForStudent(studentId: string): Promise<AttendanceRecord[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("attendance")
    .select("id, date, status, subject_id")
    .eq("student_id", studentId)
    .order("date", { ascending: false })
    .limit(500);

  if (!data || data.length === 0) {
    return [];
  }

  const subjectIds = unique(data.map((row) => row.subject_id));
  const { data: subjects } = await supabase.from("subjects").select("id, name").in("id", subjectIds);
  const subjectNames = new Map((subjects ?? []).map((row) => [row.id, row.name]));

  return data.map((row) => ({
    id: row.id,
    date: row.date,
    status: row.status,
    subjectId: row.subject_id,
    subjectName: subjectNames.get(row.subject_id) ?? "Unknown subject",
  }));
}

/**
 * Attendance totals per subject.
 *
 * Replaces the legacy `attendanceCalculator.js`, which walked the embedded
 * attendance array in the browser. The percentage is now computed from
 * indexed rows on the server.
 */
export async function summariseAttendanceForStudent(
  studentId: string,
): Promise<SubjectAttendanceSummary[]> {
  const records = await listAttendanceForStudent(studentId);
  const bySubject = new Map<string, SubjectAttendanceSummary>();

  for (const record of records) {
    const entry = bySubject.get(record.subjectId) ?? {
      subjectId: record.subjectId,
      subjectName: record.subjectName,
      present: 0,
      absent: 0,
      total: 0,
      percentage: 0,
    };

    if (record.status === "Present") {
      entry.present += 1;
    } else {
      entry.absent += 1;
    }
    entry.total += 1;
    bySubject.set(record.subjectId, entry);
  }

  return Array.from(bySubject.values()).map((entry) => ({
    ...entry,
    percentage: entry.total > 0 ? Math.round((entry.present / entry.total) * 1000) / 10 : 0,
  }));
}

export type TeacherAttendanceRecord = {
  id: string;
  date: string;
  presentCount: number;
  absentCount: number;
};

export async function listTeacherAttendance(teacherId: string): Promise<TeacherAttendanceRecord[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("teacher_attendance")
    .select("id, date, present_count, absent_count")
    .eq("teacher_id", teacherId)
    .order("date", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    date: row.date,
    presentCount: row.present_count,
    absentCount: row.absent_count,
  }));
}

// ---------------------------------------------------------------------------
// Attendance coverage (dashboards)
// ---------------------------------------------------------------------------

export type AttendanceCoverage = {
  classId: string;
  className: string;
  recordedCount: number;
};

/**
 * Classes that have at least one attendance row on `date`, with a distinct
 * student count per class (a student is counted once even when marked for
 * more than one subject that day). Classes with no rows are absent from the
 * result - the caller joins against `listClasses()` to surface the zero gap.
 */
export async function listAttendanceCoverageForDate(date: string): Promise<AttendanceCoverage[]> {
  const supabase = await createSupabaseServerClient();

  const { data: rows } = await supabase
    .from("attendance")
    .select("class_id, student_id")
    .eq("date", date);

  if (!rows || rows.length === 0) {
    return [];
  }

  const classIds = unique(rows.map((row) => row.class_id));
  const classNames = await classNamesByIds(classIds);

  const studentsByClass = new Map<string, Set<string>>();
  for (const row of rows) {
    let set = studentsByClass.get(row.class_id);
    if (!set) {
      set = new Set();
      studentsByClass.set(row.class_id, set);
    }
    set.add(row.student_id);
  }

  return classIds
    .map((classId) => ({
      classId,
      className: classNames.get(classId) ?? "Unknown class",
      recordedCount: studentsByClass.get(classId)?.size ?? 0,
    }))
    .sort((a, b) => a.className.localeCompare(b.className));
}

/**
 * Same shape as `listAttendanceCoverageForDate`, but restricted to the
 * classes the teacher teaches. Every one of the teacher's classes is returned,
 * including those with zero students marked today, so the zero values read as
 * the remaining to-do list.
 */
export async function listAttendanceCoverageForTeacher(
  teacherId: string,
  date: string,
): Promise<AttendanceCoverage[]> {
  const supabase = await createSupabaseServerClient();

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, class_id")
    .eq("teacher_id", teacherId);

  if (!subjects || subjects.length === 0) {
    return [];
  }

  const subjectIds = subjects.map((row) => row.id);
  const classIds = unique(subjects.map((row) => row.class_id));
  const classNames = await classNamesByIds(classIds);

  const { data: rows } = await supabase
    .from("attendance")
    .select("class_id, student_id")
    .eq("date", date)
    .in("subject_id", subjectIds);

  const studentsByClass = new Map<string, Set<string>>();
  for (const row of rows ?? []) {
    let set = studentsByClass.get(row.class_id);
    if (!set) {
      set = new Set();
      studentsByClass.set(row.class_id, set);
    }
    set.add(row.student_id);
  }

  return classIds
    .map((classId) => ({
      classId,
      className: classNames.get(classId) ?? "Unknown class",
      recordedCount: studentsByClass.get(classId)?.size ?? 0,
    }))
    .sort((a, b) => a.className.localeCompare(b.className));
}

export type ClassAttendanceSummary = {
  classId: string;
  className: string;
  present: number;
  absent: number;
  percentage: number;
};

/** Present/absent totals per class across the teacher's subjects. */
export async function summariseClassAttendanceForTeacher(
  teacherId: string,
): Promise<ClassAttendanceSummary[]> {
  const supabase = await createSupabaseServerClient();

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, class_id")
    .eq("teacher_id", teacherId);

  if (!subjects || subjects.length === 0) {
    return [];
  }

  const subjectIds = subjects.map((row) => row.id);
  const classIds = unique(subjects.map((row) => row.class_id));
  const classNames = await classNamesByIds(classIds);

  const { data: rows } = await supabase
    .from("attendance")
    .select("class_id, status")
    .in("subject_id", subjectIds);

  const byClass = new Map<string, { present: number; absent: number }>();
  for (const row of rows ?? []) {
    const entry = byClass.get(row.class_id) ?? { present: 0, absent: 0 };
    if (row.status === "Present") {
      entry.present += 1;
    } else {
      entry.absent += 1;
    }
    byClass.set(row.class_id, entry);
  }

  return classIds.map((classId) => {
    const entry = byClass.get(classId) ?? { present: 0, absent: 0 };
    const total = entry.present + entry.absent;
    return {
      classId,
      className: classNames.get(classId) ?? "Unknown class",
      present: entry.present,
      absent: entry.absent,
      percentage: total > 0 ? Math.round((entry.present / total) * 1000) / 10 : 0,
    };
  });
}

export type MarksBySubjectSummary = {
  subjectId: string;
  subjectName: string;
  count: number;
};

/** Number of `exam_results` rows per subject the teacher teaches. */
export async function countMarksBySubjectForTeacher(
  teacherId: string,
): Promise<MarksBySubjectSummary[]> {
  const supabase = await createSupabaseServerClient();

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("teacher_id", teacherId);

  if (!subjects || subjects.length === 0) {
    return [];
  }

  const subjectIds = subjects.map((row) => row.id);
  const subjectById = new Map(subjects.map((row) => [row.id, row.name]));

  const { data: rows } = await supabase
    .from("exam_results")
    .select("subject_id")
    .in("subject_id", subjectIds);

  const countBySubject = new Map<string, number>();
  for (const row of rows ?? []) {
    countBySubject.set(row.subject_id, (countBySubject.get(row.subject_id) ?? 0) + 1);
  }

  return subjectIds.map((subjectId) => ({
    subjectId,
    subjectName: subjectById.get(subjectId) ?? "Unknown subject",
    count: countBySubject.get(subjectId) ?? 0,
  }));
}

export type SubjectRosterRow = {
  student: StudentSummary;
  marksObtained: number | null;
  present: number;
  absent: number;
  percentage: number;
};

/**
 * A class's roster with each student's marks and attendance for one subject.
 *
 * Runs exactly three queries no matter how large the class is. The obvious
 * implementation - loop the students and call `listExamResultsForStudent` plus
 * `summariseAttendanceForStudent` for each - issues 2N round trips, which for
 * a 40-student class is 80 concurrent requests to PostgREST for a single page
 * render. Fetching the two child tables once and joining in memory keeps the
 * cost flat.
 */
export async function getSubjectRoster(
  subjectId: string,
  classId: string,
): Promise<SubjectRosterRow[]> {
  const supabase = await createSupabaseServerClient();

  const [studentsResult, marksResult, attendanceResult] = await Promise.all([
    supabase
      .from("student_directory")
      .select("student_id, full_name, email, roll_number, class_id, class_name")
      .eq("class_id", classId)
      .order("roll_number"),
    supabase.from("exam_results").select("student_id, marks_obtained").eq("subject_id", subjectId),
    supabase.from("attendance").select("student_id, status").eq("subject_id", subjectId),
  ]);

  const marksByStudent = new Map<string, number>();
  for (const row of marksResult.data ?? []) {
    marksByStudent.set(row.student_id, row.marks_obtained);
  }

  const attendanceByStudent = new Map<string, { present: number; absent: number }>();
  for (const row of attendanceResult.data ?? []) {
    const entry = attendanceByStudent.get(row.student_id) ?? { present: 0, absent: 0 };
    if (row.status === "Present") {
      entry.present += 1;
    } else {
      entry.absent += 1;
    }
    attendanceByStudent.set(row.student_id, entry);
  }

  return (studentsResult.data ?? []).map((row) => {
    const attendance = attendanceByStudent.get(row.student_id) ?? { present: 0, absent: 0 };
    const total = attendance.present + attendance.absent;

    return {
      student: {
        id: row.student_id,
        fullName: row.full_name,
        email: row.email,
        rollNumber: row.roll_number,
        classId: row.class_id,
        className: row.class_name,
      },
      marksObtained: marksByStudent.get(row.student_id) ?? null,
      present: attendance.present,
      absent: attendance.absent,
      percentage: total > 0 ? Math.round((attendance.present / total) * 1000) / 10 : 0,
    };
  });
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

/**
 * Head-only counts. `head: true` fetches no rows, so each of these is
 * essentially an index scan rather than a data transfer.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createSupabaseServerClient();

  const countOf = async (table: "students" | "profiles" | "classes" | "subjects" | "notices" | "complaints", filter?: { column: string; value: string }) => {
    let query = supabase.from(table).select("*", { count: "exact", head: true });
    if (filter) {
      query = query.eq(filter.column, filter.value);
    }
    const { count } = await query;
    return count ?? 0;
  };

  const [students, teachers, admins, classes, subjects, notices, complaints] = await Promise.all([
    countOf("students"),
    countOf("profiles", { column: "role", value: "teacher" }),
    countOf("profiles", { column: "role", value: "admin" }),
    countOf("classes"),
    countOf("subjects"),
    countOf("notices"),
    countOf("complaints"),
  ]);

  return { students, teachers, admins, classes, subjects, notices, complaints };
}
