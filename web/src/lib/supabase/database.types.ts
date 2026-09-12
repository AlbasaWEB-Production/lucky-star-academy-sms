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
          created_at: string;
          id: string;
          name: string;
          school_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          school_id: string;
          updated_at?: string;
        };
        Update: {
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
    };
    Functions: {
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
export type StudentDirectoryEntry = Views<"student_directory">;
