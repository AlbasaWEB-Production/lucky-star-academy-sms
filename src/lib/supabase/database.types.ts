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
      admissions: {
        Row: {
          class_id: string | null;
          created_at: string;
          created_by: string | null;
          declined_on: string | null;
          enrolled_on: string | null;
          guardian_name: string | null;
          guardian_phone: string | null;
          id: string;
          intake_term_id: string | null;
          offered_on: string | null;
          pupil_name: string;
          received_on: string | null;
          school_id: string;
          source: string | null;
          stage: string;
          stage_date: string;
          submitted_on: string | null;
          updated_at: string;
        };
        Insert: {
          class_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          declined_on?: string | null;
          enrolled_on?: string | null;
          guardian_name?: string | null;
          guardian_phone?: string | null;
          id?: string;
          intake_term_id?: string | null;
          offered_on?: string | null;
          pupil_name: string;
          received_on?: string | null;
          school_id: string;
          source?: string | null;
          stage?: string;
          stage_date?: string;
          submitted_on?: string | null;
          updated_at?: string;
        };
        Update: {
          class_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          declined_on?: string | null;
          enrolled_on?: string | null;
          guardian_name?: string | null;
          guardian_phone?: string | null;
          id?: string;
          intake_term_id?: string | null;
          offered_on?: string | null;
          pupil_name?: string;
          received_on?: string | null;
          school_id?: string;
          source?: string | null;
          stage?: string;
          stage_date?: string;
          submitted_on?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
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
          capacity: number | null;
          created_at: string;
          id: string;
          name: string;
          school_id: string;
          updated_at: string;
        };
        Insert: {
          campus?: string | null;
          capacity?: number | null;
          created_at?: string;
          id?: string;
          name: string;
          school_id: string;
          updated_at?: string;
        };
        Update: {
          campus?: string | null;
          capacity?: number | null;
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
          term_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          marks_obtained?: number;
          school_id: string;
          student_id: string;
          subject_id: string;
          term_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          marks_obtained?: number;
          school_id?: string;
          student_id?: string;
          subject_id?: string;
          term_id?: string | null;
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
          enrolled_at: string | null;
          enrolment_status: string;
          id: string;
          roll_number: number;
          school_id: string;
          status_date: string | null;
          updated_at: string;
        };
        Insert: {
          class_id: string;
          created_at?: string;
          enrolled_at?: string | null;
          enrolment_status?: string;
          id: string;
          roll_number: number;
          school_id: string;
          status_date?: string | null;
          updated_at?: string;
        };
        Update: {
          class_id?: string;
          created_at?: string;
          enrolled_at?: string | null;
          enrolment_status?: string;
          id?: string;
          roll_number?: number;
          school_id?: string;
          status_date?: string | null;
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
      fee_assessments: {
        Row: {
          amount: number;
          class_id: string;
          created_at: string;
          due_date: string | null;
          id: string;
          school_id: string;
          student_id: string;
          term_id: string;
          updated_at: string;
        };
        Insert: {
          amount: number;
          class_id: string;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          school_id: string;
          student_id: string;
          term_id: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          class_id?: string;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          school_id?: string;
          student_id?: string;
          term_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      fee_payments: {
        Row: {
          amount: number;
          assessment_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_reversal: boolean;
          method: string;
          payment_date: string;
          receipt_number: number;
          reversal_reason: string | null;
          reverses_payment_id: string | null;
          school_id: string;
          updated_at: string;
        };
        Insert: {
          amount: number;
          assessment_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_reversal?: boolean;
          method: string;
          payment_date?: string;
          receipt_number?: number;
          reversal_reason?: string | null;
          reverses_payment_id?: string | null;
          school_id: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          assessment_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_reversal?: boolean;
          method?: string;
          payment_date?: string;
          receipt_number?: number;
          reversal_reason?: string | null;
          reverses_payment_id?: string | null;
          school_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      fee_structures: {
        Row: {
          amount: number;
          class_id: string;
          created_at: string;
          description: string;
          due_date: string | null;
          id: string;
          school_id: string;
          term_id: string;
          updated_at: string;
        };
        Insert: {
          amount: number;
          class_id: string;
          created_at?: string;
          description: string;
          due_date?: string | null;
          id?: string;
          school_id: string;
          term_id: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          class_id?: string;
          created_at?: string;
          description?: string;
          due_date?: string | null;
          id?: string;
          school_id?: string;
          term_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      budget_lines: {
        Row: {
          budget_amount: number;
          cost_centre: string;
          created_at: string;
          description: string | null;
          id: string;
          school_id: string;
          term_id: string;
          updated_at: string;
        };
        Insert: {
          budget_amount: number;
          cost_centre: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          school_id: string;
          term_id: string;
          updated_at?: string;
        };
        Update: {
          budget_amount?: number;
          cost_centre?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          school_id?: string;
          term_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          amount: number;
          cost_centre: string;
          created_at: string;
          created_by: string | null;
          description: string;
          expense_date: string;
          id: string;
          school_id: string;
          term_id: string;
          updated_at: string;
        };
        Insert: {
          amount: number;
          cost_centre: string;
          created_at?: string;
          created_by?: string | null;
          description: string;
          expense_date?: string;
          id?: string;
          school_id: string;
          term_id: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          cost_centre?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          expense_date?: string;
          id?: string;
          school_id?: string;
          term_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      incidents: {
        Row: {
          class_id: string;
          created_at: string;
          date: string;
          id: string;
          incident_type: string;
          note: string | null;
          recorded_by: string | null;
          resolved: boolean;
          resolved_on: string | null;
          school_id: string;
          student_id: string;
          updated_at: string;
        };
        Insert: {
          class_id: string;
          created_at?: string;
          date?: string;
          id?: string;
          incident_type: string;
          note?: string | null;
          recorded_by?: string | null;
          resolved?: boolean;
          resolved_on?: string | null;
          school_id: string;
          student_id: string;
          updated_at?: string;
        };
        Update: {
          class_id?: string;
          created_at?: string;
          date?: string;
          id?: string;
          incident_type?: string;
          note?: string | null;
          recorded_by?: string | null;
          resolved?: boolean;
          resolved_on?: string | null;
          school_id?: string;
          student_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      timetable_slots: {
        Row: {
          created_at: string;
          day_of_week: number;
          id: string;
          period: number;
          room: string | null;
          school_id: string;
          subject_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          day_of_week: number;
          id?: string;
          period: number;
          room?: string | null;
          school_id: string;
          subject_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          day_of_week?: number;
          id?: string;
          period?: number;
          room?: string | null;
          school_id?: string;
          subject_id?: string;
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
      v_fee_status_by_student: {
        Row: {
          amount_due: number;
          balance: number;
          campus: string | null;
          class_id: string;
          class_name: string;
          due_date: string | null;
          paid: number;
          school_id: string;
          student_id: string;
          student_name: string;
          term_id: string;
        };
        Relationships: [];
      };
      v_fees_collected_vs_expected: {
        Row: {
          avg_days_to_pay: number | null;
          collected_pesewas: number;
          collection_rate: number | null;
          expected_pesewas: number;
          school_id: string;
          start_date: string | null;
          term_id: string;
          term_name: string;
        };
        Relationships: [];
      };
      v_outstanding_by_class: {
        Row: {
          campus: string | null;
          class_id: string;
          class_name: string;
          collected_pesewas: number;
          expected_pesewas: number;
          outstanding_pesewas: number;
          pupils_with_assessment: number;
          school_id: string;
          term_id: string;
          term_name: string;
        };
        Relationships: [];
      };
      v_budget_vs_actual: {
        Row: {
          actual_pesewas: number;
          budget_pesewas: number;
          cost_centre: string;
          school_id: string;
          term_id: string;
          term_name: string;
          variance_pesewas: number;
        };
        Relationships: [];
      };
      v_cash_position: {
        Row: {
          expenses_pesewas: number;
          income_pesewas: number;
          month: string;
          net_pesewas: number;
          running_balance_pesewas: number;
          school_id: string;
        };
        Relationships: [];
      };
      v_class_average_trend: {
        Row: {
          avg_mark: number | null;
          class_id: string;
          class_name: string;
          marks_count: number;
          pupils_assessed: number;
          school_id: string;
          term_id: string;
          term_name: string;
          term_number: number;
        };
        Relationships: [];
      };
      v_enrolment_trend_by_class_campus: {
        Row: {
          campus: string | null;
          class_id: string;
          class_name: string;
          enrolled: number;
          school_id: string;
          term_id: string;
          term_name: string;
          term_number: number;
        };
        Relationships: [];
      };
      v_pass_promotion_rates: {
        Row: {
          assessed_pupils: number;
          class_id: string;
          class_name: string;
          passed_marks: number;
          pass_rate_percent: number | null;
          promotion_rate_percent: number | null;
          promoted_pupils: number;
          school_id: string;
          term_id: string;
          term_name: string;
          total_marks: number;
        };
        Relationships: [];
      };
      v_retention_dropout: {
        Row: {
          changes_total: number;
          left_school: number;
          retained: number;
          school_id: string;
          term_id: string;
          term_name: string;
          term_number: number;
        };
        Relationships: [];
      };
      v_admissions_funnel: {
        Row: {
          conversion_percent: number;
          leads: number;
          stage: string;
        };
        Relationships: [];
      };
      v_incidents_by_type: {
        Row: {
          incident_count: number;
          incident_type: string;
          resolved_count: number;
          unresolved_count: number;
        };
        Relationships: [];
      };
      v_incidents_per_hundred_by_class: {
        Row: {
          active_pupils: number;
          campus: string | null;
          class_id: string;
          class_name: string;
          incidents: number;
          per_hundred: number | null;
        };
        Relationships: [];
      };
      v_capacity_utilisation: {
        Row: {
          campus: string | null;
          capacity: number | null;
          class_id: string;
          class_name: string;
          pupil_count: number;
          utilisation_percent: number | null;
        };
        Relationships: [];
      };
      v_new_enrolments_by_class_intake: {
        Row: {
          campus: string | null;
          class_id: string;
          class_name: string;
          enrolled: number;
          school_id: string;
          term_id: string | null;
          term_name: string | null;
          term_number: number | null;
        };
        Relationships: [];
      };
      v_pupil_teacher_ratio: {
        Row: {
          campus: string | null;
          class_id: string;
          class_name: string;
          pupil_count: number;
          ratio: number | null;
          school_id: string;
          teacher_count: number;
        };
        Relationships: [];
      };
      v_teacher_attendance_rate: {
        Row: {
          absent_total: number;
          present_total: number;
          rate_percent: number | null;
          recorded_days: number;
          school_id: string;
          teacher_id: string;
          teacher_name: string;
        };
        Relationships: [];
      };
      v_timetable_weekly: {
        Row: {
          class_id: string;
          class_name: string;
          day_of_week: number;
          period: number;
          room: string | null;
          school_id: string;
          subject_code: string;
          subject_id: string;
          subject_name: string;
          teacher_id: string | null;
          teacher_name: string | null;
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
      user_role: "accountant" | "admin" | "schedule_officer" | "student" | "teacher";
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

/**
 * Application-facing role name.
 *
 * Five portals: `admin`, `teacher`, `student`, and the two staff roles added
 * for the accountant and the schedule officer. Every `Record<UserRole, ...>`
 * in the app is therefore exhaustive by construction - adding a sixth value
 * here is a compile error until it is given a home, a sidebar and a sign-in
 * page.
 */
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
export type Admission = Tables<"admissions">;
export type StudentDirectoryEntry = Views<"student_directory">;

// Analytic view models (all `security_invoker`, so RLS still applies).
export type AttendanceRateByClass = Views<"v_attendance_rate_by_class">;
export type MarksByClassSubject = Views<"v_marks_by_class_subject">;
export type EnrolmentByCampus = Views<"v_enrolment_by_campus">;
export type AttendanceHeatmapRow = Views<"v_attendance_heatmap">;
export type TeacherSubjectLoad = Views<"v_teacher_subject_load">;
export type GradeDistributionRow = Views<"v_grade_distribution">;

// Phase 1 - fees and finance (amounts are integer pesewas; see src/lib/money).
export type FeeStructure = Tables<"fee_structures">;
export type FeeAssessment = Tables<"fee_assessments">;
export type FeePayment = Tables<"fee_payments">;
export type BudgetLine = Tables<"budget_lines">;
export type Expense = Tables<"expenses">;
export type FeeStatusByStudent = Views<"v_fee_status_by_student">;
export type FeesCollectedVsExpected = Views<"v_fees_collected_vs_expected">;
export type OutstandingByClass = Views<"v_outstanding_by_class">;
export type BudgetVsActual = Views<"v_budget_vs_actual">;
export type CashPosition = Views<"v_cash_position">;

// Phase 3 - people and teaching.
export type PupilTeacherRatio = Views<"v_pupil_teacher_ratio">;
export type TeacherAttendanceRate = Views<"v_teacher_attendance_rate">;
export type AdmissionsFunnel = Views<"v_admissions_funnel">;
export type NewEnrolmentsByClassIntake = Views<"v_new_enrolments_by_class_intake">;
export type CapacityUtilisation = Views<"v_capacity_utilisation">;

// Phase 4 - staff portals: the accountant and the schedule officer.
export type TimetableSlot = Tables<"timetable_slots">;
export type TimetableWeeklyRow = Views<"v_timetable_weekly">;

export type AtRiskPupil = Functions<"fn_at_risk_pupils">;
