import type { FormOption } from "./FeeStructureForm";

/**
 * The school's fixed list of cost centres, used by both budget lines and
 * expenses so the two always agree on how money is categorised. The list is a
 * constraint in the database; the form mirrors it so a user cannot pick a value
 * the column will reject.
 */
export const COST_CENTRE_OPTIONS: FormOption[] = [
  { value: "Teaching", label: "Teaching" },
  { value: "Administration", label: "Administration" },
  { value: "Utilities", label: "Utilities" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Transport", label: "Transport" },
  { value: "Events", label: "Events" },
  { value: "Other", label: "Other" },
];
