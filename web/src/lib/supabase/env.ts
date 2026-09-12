/**
 * Supabase environment access.
 *
 * Values are read lazily through getters rather than captured as module-level
 * constants. `next build` imports route modules to collect metadata, so a
 * throw-on-import here would make the project impossible to build before the
 * Supabase project exists. Instead, a missing value fails at the point of use
 * with an actionable message, and the UI surfaces `isSupabaseConfigured()`
 * as a setup banner.
 *
 * Note on NEXT_PUBLIC_*: Next.js inlines these at build time by textual
 * substitution, which only works when the full `process.env.FOO` expression
 * appears in the source. Keep the literals below intact.
 */

function readEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}.\n` +
        `Copy web/.env.example to web/.env.local, then fill in the values from ` +
        `your Supabase project's Connect panel (Project Settings -> API).`,
    );
  }
  return value;
}

export function getSupabaseUrl(): string {
  return readEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string {
  return readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Secret key. Bypasses Row Level Security, so it must never reach the browser.
 * Only import this from modules that also import "server-only".
 *
 * Supabase is migrating from the legacy `service_role` JWT to the new
 * `sb_secret_...` key format; both are accepted so the project works on either.
 */
export function getSupabaseSecretKey(): string {
  return readEnv(
    "SUPABASE_SECRET_KEY",
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Domain used to synthesise login emails for students, who are identified by
 * roll number rather than by a real mailbox. Must be a domain the project
 * controls, or any reserved-looking domain, because Supabase Auth validates
 * the format of the address it is given.
 */
export function getStudentEmailDomain(): string {
  return process.env.STUDENT_EMAIL_DOMAIN ?? "students.example.com";
}

/**
 * True when the public Supabase configuration is present. Used to render a
 * setup notice instead of crashing when the app is opened before the project
 * has been connected.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** True when server-side privileged operations are possible. */
export function isSupabaseAdminConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}
