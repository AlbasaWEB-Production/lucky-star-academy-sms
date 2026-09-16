import type { UserRole } from "@/lib/supabase/database.types";

export type NavItem = {
  label: string;
  href: string;
};

export type NavSection = {
  heading?: string;
  items: NavItem[];
};

/**
 * Sidebar navigation per role.
 *
 * The routes mirror the original page tree (Admin/studentRelated,
 * teacherRelated, classRelated, subjectRelated, noticeRelated) but flattened
 * into the paths a role actually needs.
 *
 * This is presentation only. A user who types another role's URL is redirected
 * by src/proxy.ts, and Row Level Security is what actually denies the data.
 */
export const NAV_SECTIONS: Record<UserRole, NavSection[]> = {
  admin: [
    {
      items: [
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Profile", href: "/admin/profile" },
      ],
    },
    {
      heading: "People",
      items: [
        { label: "Students", href: "/admin/students" },
        { label: "Admissions", href: "/admin/admissions" },
        { label: "Teachers", href: "/admin/teachers" },
        { label: "Administrators", href: "/admin/admins" },
      ],
    },
    {
      heading: "Academics",
      items: [
        { label: "Classes", href: "/admin/classes" },
        { label: "Subjects", href: "/admin/subjects" },
        { label: "Attendance", href: "/admin/attendance" },
        { label: "Exam marks", href: "/admin/exam-marks" },
      ],
    },
    {
      heading: "Analytics",
      items: [
        { label: "Performance", href: "/admin/analytics/academics-performance" },
        { label: "Enrolment", href: "/admin/analytics/academics-enrolment" },
        { label: "People", href: "/admin/analytics/people" },
        { label: "Admissions", href: "/admin/analytics/admissions" },
      ],
    },
    {
      heading: "Finance",
      items: [
        { label: "Fee overview", href: "/admin/fees" },
        { label: "Structures", href: "/admin/fees/structures" },
        { label: "Assessments", href: "/admin/fees/assessments" },
        { label: "Payments", href: "/admin/fees/payments" },
        { label: "Budget", href: "/admin/fees/budget" },
        { label: "Expenses", href: "/admin/fees/expenses" },
      ],
    },
    {
      heading: "Communication",
      items: [
        { label: "Notices", href: "/admin/notices" },
        { label: "Complaints", href: "/admin/complaints" },
      ],
    },
  ],
  teacher: [
    {
      items: [
        { label: "Dashboard", href: "/teacher/dashboard" },
        { label: "Profile", href: "/teacher/profile" },
      ],
    },
    {
      heading: "Teaching",
      items: [
        { label: "My classes", href: "/teacher/classes" },
        { label: "Students", href: "/teacher/students" },
        { label: "Attendance", href: "/teacher/attendance" },
        { label: "Exam marks", href: "/teacher/exam-marks" },
      ],
    },
    {
      heading: "Communication",
      items: [{ label: "Notices", href: "/teacher/notices" }],
    },
  ],
  student: [
    {
      items: [
        { label: "Dashboard", href: "/student/dashboard" },
        { label: "Profile", href: "/student/profile" },
      ],
    },
    {
      heading: "Academics",
      items: [
        { label: "My subjects", href: "/student/subjects" },
        { label: "My progress", href: "/student/progress" },
        { label: "My attendance", href: "/student/attendance" },
        { label: "My fees", href: "/student/finance" },
      ],
    },
    {
      heading: "Communication",
      items: [
        { label: "Notices", href: "/student/notices" },
        { label: "Complaints", href: "/student/complaints" },
      ],
    },
  ],
};
