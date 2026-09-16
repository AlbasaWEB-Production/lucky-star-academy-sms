/**
 * The single place money is formatted and parsed.
 *
 * The database stores every amount as an integer number of pesewas
 * (100 pesewas = 1 Ghana cedi). Every screen, chart and server action that
 * needs money imports from here — this module is the ONLY place that converts
 * between cedis and pesewas, so the "divide by 100" happens once and nowhere
 * else.
 *
 * There is no `numeric(12,2)` in the schema and no currency symbol is ever
 * hand-typed in a screen. A screen that wants "GH¢ 180.00" calls `formatCedis`.
 */

/** Format integer pesewas as a Ghana cedi string, e.g. `GH¢ 180.00`. */
export function formatCedis(pesewas: number): string {
  const sign = pesewas < 0 ? "-" : "";
  const abs = Math.abs(pesewas);
  const whole = Math.trunc(abs / 100);
  const fraction = abs % 100;
  return `${sign}GH¢ ${whole.toLocaleString("en-GH")}.${fraction.toString().padStart(2, "0")}`;
}

/** Integer pesewas -> cedi number, for feeding a chart's numeric axis. */
export function cedisFromPesewas(pesewas: number): number {
  return pesewas / 100;
}

/** Cedi number -> integer pesewas, e.g. `pesewasFromCedis(180.5)` = 18050. */
export function pesewasFromCedis(cedis: number): number {
  return Math.round(cedis * 100);
}

/**
 * A short cedi label for chart axis ticks, e.g. `formatCedisCompact(184000)`
 * = "1.8k" (that is GH¢ 1840). Keeps tick text short on a crowded axis.
 */
export function formatCedisCompact(pesewas: number): string {
  const cedis = cedisFromPesewas(pesewas);
  if (Math.abs(cedis) >= 1000) {
    const thousands = cedis / 1000;
    const digits = Number.isInteger(thousands) ? 0 : 1;
    return `${thousands.toFixed(digits)}k`;
  }
  return `${Math.round(cedis)}`;
}

/**
 * Parse a cedi amount a user typed (e.g. "180.50", "GH¢ 1,800", "180") into
 * integer pesewas. Returns null when the text is empty or is not a
 * non-negative number, so a form can fall back to an empty field.
 */
export function cedisStringToPesewas(input: string): number | null {
  const cleaned = input.replace(/[^\d.]/g, "").trim();
  if (cleaned === "") {
    return null;
  }
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  return pesewasFromCedis(value);
}
