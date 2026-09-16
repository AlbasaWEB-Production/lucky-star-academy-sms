/**
 * Admissions stage domain model.
 *
 * Pure constants and label/advance helpers, safe to import from both server
 * and client modules — so the shared `@/lib/data/admissions` readers (server)
 * and the `@/components/admin/admissions` forms (client) agree on what a stage
 * is called without either pulling in `server-only`.
 */

export const ADMISSION_STAGES = [
  "enquiry",
  "application",
  "offer",
  "enrolled",
  "declined",
] as const;

export type AdmissionStage = (typeof ADMISSION_STAGES)[number];

export function stageLabel(stage: string): string {
  switch (stage) {
    case "enquiry":
      return "Enquiry";
    case "application":
      return "Application";
    case "offer":
      return "Offer";
    case "enrolled":
      return "Enrolled";
    case "declined":
      return "Declined";
    default:
      return stage;
  }
}

/** The next stage a lead advances to, or null at a terminal stage. */
export function nextStage(stage: AdmissionStage): AdmissionStage | null {
  const index = ADMISSION_STAGES.indexOf(stage);
  if (index < 0 || index >= ADMISSION_STAGES.length - 1) {
    return null;
  }
  return ADMISSION_STAGES[index + 1];
}

export function isTerminalStage(stage: string): boolean {
  return stage === "enrolled" || stage === "declined";
}
