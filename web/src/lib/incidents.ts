/**
 * Incident type domain model.
 *
 * Pure constants and label helpers, safe to import from both server and client
 * modules — so the shared `@/lib/data/welfare` readers (server) and the
 * `@/components/admin/incidents` forms (client) agree on what an incident type
 * is called without either pulling in `server-only`.
 */

export const INCIDENT_TYPES = [
  "lateness",
  "truancy",
  "fighting",
  "bullying",
  "property_damage",
  "other",
] as const;

export type IncidentType = (typeof INCIDENT_TYPES)[number];

export function incidentTypeLabel(type: string): string {
  switch (type) {
    case "lateness":
      return "Lateness";
    case "truancy":
      return "Truancy";
    case "fighting":
      return "Fighting";
    case "bullying":
      return "Bullying";
    case "property_damage":
      return "Property damage";
    case "other":
      return "Other";
    default:
      return type;
  }
}
