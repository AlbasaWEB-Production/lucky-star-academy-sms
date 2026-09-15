/**
 * Database types for the public schema.
 *
 * HAND-WRITTEN to mirror supabase/migrations/*.sql, because `supabase gen
 * types --linked` needs a linked project and a database to introspect.
 *
 * Once the project is linked, regenerate and diff:
 *
 *   cd web && npm run db:types
 *
 * The regenerated file will add `Relationships` entries (this version sets
 * them to `[]`). That only enables PostgREST embedded selects -
 * `select('*, classes(name)')` - which the data layer in src/lib/data
 * deliberately avoids, so nothing breaks either way.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      attendance: {
        Row: {
          class_id: string;
          created_at: string;
          date: string;
          id: string;
          recorded_by: string | null;
          school_id: string;
          status: Database["public"]["Enums"]["attendance_status"];
          student_id: string;
          subject_id: string;
        };
        Insert: {
          class_id: string;
          created_at?: string;
          date: string;
          id?: string;
          recorded_by?: string | null;
          school_id: string;
          status: Database["public"]["Enums"]["attendance_status"];
          student_id: string;
          subject_id: string;
        };
        Update: {
          class_id?: string;
          created_at?: string;
          date?: string;
          id?: string;
          recorded_by?: string | null;
          school_id?: string;
          status?: Database["public"]["Enums"]["attendance_status"];
          student_id?: string;
          subject_id?: string;
        };
        Relationships: [];
      };
      classes: {
        Row: {
          campus: string | null;
          created_at: string;
          id: string;
          name: string;
          school_id: string;
          updated_at: string;
        };
        Insert: {
          campus?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          school_id: string;
          updated_at?: string;
        };
        Update: {
          campus?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          school_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      complaints: {
        Row: {
          complaint: string;
          created_at: string;
          date: string;
          id: string;
          school_id: string;
          student_id: string;
        };
        Insert: {
          complaint: string;
          created_at?: string;
          date?: string;
          id?: string;
          school_id: string;
          student_id: string;
        };
        Update: {
          complaint?: string;
          created_at?: string;
          date?: string;
          id?: string;
          school_id?: string;
          student_id?: string;
        };
        Relationships: [];
      };
      dashboard_thresholds: {
        Row: {
          id: number;
          key: string;
          school_id: string;
          updated_at: string;
          value: string;
        };
        Insert: {
          id?: never;
          key: string;
          school_id: string;
          updated_at?: string;
          value: string;
        };
        Update: {
          id?: never;
          key?: string;
          school_id?: string;
          updated_at?: string;
          value?: string;
        };
        Relationships: [];
      };
      exam_results: {
        Row: {
          created_at: string;
          id: string;
          marks_obtained: number;
          school_id: string;
          student_id: string;
          subject_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          marks_obtained?: number;
          school_id: string;
          student_id: string;
          subject_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          marks_obtained?: number;
          school_id?: string;
          student_id?: string;
          subject_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notices: {
        Row: {
          created_at: string;
          created_by: string | null;
          date: string;
          details: string;
          id: string;
          school_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          date?: string;
          details: string;
          id?: string;
          school_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          date?: string;
          details?: string;
          id?: string;
          school_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          school_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name: string;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          school_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          school_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      schools: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      students: {
        Row: {
          class_id: string;
          created_at: string;
          id: string;
          roll_number: number;
          school_id: string;
          updated_at: string;
        };
        Insert: {
          class_id: string;
          created_at?: string;
          id: string;
          roll_number: number;
          school_id: string;
          updated_at?: string;
        };
        Update: {
          class_id?: string;
          created_at?: string;
          id?: string;
          roll_number?: number;
          school_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          class_id: string;
          code: string;
          created_at: string;
          id: string;
          name: string;
          school_id: string;
          sessions: string;
          teacher_id: string | null;
          updated_at: string;
        };
        Insert: {
          class_id: string;
          code: string;
          created_at?: string;
          id?: string;
          name: string;
          school_id: string;
          sessions: string;
          teacher_id?: string | null;
          updated_at?: string;
        };
        Update: {
          class_id?: string;
          code?: string;
          created_at?: string;
          id?: string;
          name?: string;
          school_id?: string;
          sessions?: string;
          teacher_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      teacher_attendance: {
        Row: {
          absent_count: number;
          created_at: string;
          date: string;
          id: string;
          present_count: number;
          school_id: string;
          teacher_id: string;
        };
        Insert: {
          absent_count?: number;
          created_at?: string;
          date: string;
          id?: string;
          present_count?: number;
          school_id: string;
          teacher_id: string;
        };
        Update: {
          absent_count?: number;
          created_at?: string;
          date?: string;
          id?: string;
          present_count?: number;
          school_id?: string;
          teacher_id?: string;
        };
        Relationships: [];
      };
      terms: {
        Row: {
          created_at: string;
          end_date: string;
          id: string;
          name: string;
          school_id: string;
          start_date: string;
          term_number: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          end_date: string;
          id?: string;
          name: string;
          school_id: string;
          start_date: string;
          term_number: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          end_date?: string;
          id?: string;
          name?: string;
          school_id?: string;
          start_date?: string;
          term_number?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      student_directory: {
        Row: {
          class_id: string;
          class_name: string;
          email: string | null;
          full_name: string;
          roll_number: number;
          school_id: string;
          school_name: string;
          school_slug: string;
          student_id: string;
        };
        Relationships: [];
      };
      v_attendance_heatmap: {
        Row: {
          class_id: string;
          date: string;
          roll_number: number;
          school_id: string;
          status: Database["public"]["Enums"]["attendance_status"];
          student_id: string;
          student_name: string;
        };
        Relationships: [];
      };
      v_attendance_rate_by_class: {
        Row: {
          absent: number;
          campus: string | null;
          class_id: string;
          class_name: string;
          present: number;
          rate_percent: number;
          school_id: string;
          total_registers: number;
        };
        Relationships: [];
      };
      v_enrolment_by_campus: {
        Row: {
          campus: string | null;
          school_id: string;
          student_count: number;
        };
        Relationships: [];
      };
      v_grade_distribution: {
        Row: {
          class_id: string;
          marks_obtained: number;
          school_id: string;
          subject_id: string;
          subject_name: string;
        };
        Relationships: [];
      };
      v_marks_by_class_subject: {
        Row: {
          avg_mark: number | null;
          class_id: string;
          class_name: string;
          school_id: string;
          student_count: number;
          subject_id: string;
          subject_name: string;
        };
        Relationships: [];
      };
      v_teacher_subject_load: {
        Row: {
          school_id: string;
          subject_count: number;
          teacher_id: string | null;
          teacher_name: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      fn_at_risk_pupils: {
        Args: Record<string, never>;
        Returns: {
          campus: string | null;
          class_id: string;
          class_name: string;
          reason: string;
          roll_number: number;
          school_id: string;
          student_id: string;
          student_name: string;
        }[];
      };
      jwt_role: {
        Args: Record<string, never>;
        Returns: string;
      };
      jwt_school_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      teaches_subject: {
        Args: { p_subject_id: string };
        Returns: boolean;
      };
      teaches_class: {
        Args: { p_class_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      attendance_status: "Present" | "Absent";
      user_role: "admin" | "teacher" | "student";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ---------------------------------------------------------------------------
// Convenience aliases, matching the names emitted by `supabase gen types`
// ---------------------------------------------------------------------------

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];

export type Views<T extends keyof PublicSchema["Views"]> =
  PublicSchema["Views"][T]["Row"];

/**
 * A single row of a set-returning function, e.g.
 * `Functions<"fn_at_risk_pupils">` is one at-risk pupil.
 */
export type Functions<T extends keyof PublicSchema["Functions"]> =
  PublicSchema["Functions"][T]["Returns"] extends (infer R)[] ? R : never;

export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];

/** Application-facing role name, matching the legacy Admin/Teacher/Student labels. */
export type UserRole = Enums<"user_role">;

export type School = Tables<"schools">;
export type Profile = Tables<"profiles">;
export type ClassRow = Tables<"classes">;
export type Subject = Tables<"subjects">;
export type Student = Tables<"students">;
export type ExamResult = Tables<"exam_results">;
export type Attendance = Tables<"attendance">;
export type TeacherAttendance = Tables<"teacher_attendance">;
export type Notice = Tables<"notices">;
export type Complaint = Tables<"complaints">;
export type Term = Tables<"terms">;
export type DashboardThreshold = Tables<"dashboard_thresholds">;
export type StudentDirectoryEntry = Views<"student_directory">;

// Analytic view models (all `security_invoker`, so RLS still applies).
export type AttendanceRateByClass = Views<"v_attendance_rate_by_class">;
export type MarksByClassSubject = Views<"v_marks_by_class_subject">;
export type EnrolmentByCampus = Views<"v_enrolment_by_campus">;
export type AttendanceHeatmapRow = Views<"v_attendance_heatmap">;
export type TeacherSubjectLoad = Views<"v_teacher_subject_load">;
export type GradeDistributionRow = Views<"v_grade_distribution">;

export type AtRiskPupil = Functions<"fn_at_risk_pupils">;
