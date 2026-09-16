"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Box, Typography } from "@mui/material";
import { CHART_COLORS } from "./tokens";

/**
 * Enrolment trend over terms, one line per campus.
 *
 * The school is Primary 1–6 across two campuses, so a line per *campus* (rather
 * than per class) keeps the chart readable — the per-class, per-term detail
 * lives in the table beside it. Pupils whose enrolment date is unknown are not
 * guessed into a term, so a term's line can be lower than the roll; the title
 * says "enrolled" for that reason.
 */
export default function EnrolmentTrendChart({
  data,
  height = 320,
}: {
  /** One row per (campus, term) with the count of pupils enrolled that term. */
  data: { termName: string; campus: string | null; enrolled: number }[];
  height?: number;
}) {
  const question = "Pupils enrolled each term, by campus";

  if (data.length === 0) {
    return (
      <Box sx={{ height, display: "grid", placeItems: "center" }}>
        <Typography variant="body2" color="text.secondary">
          {question} — nothing to chart yet.
        </Typography>
      </Box>
    );
  }

  // Campuses in first-appearance order (stable across renders), each mapped to
  // a line. `null` campus becomes "No campus set".
  const campuses: string[] = [];
  for (const row of data) {
    const key = row.campus ?? "No campus set";
    if (!campuses.includes(key)) {
      campuses.push(key);
    }
  }

  // Shape into one row per term, with a key per campus. A campus with no
  // enrolment that term is `0` rather than absent, so the line stays continuous.
  const byTerm = new Map<string, Record<string, number | string>>();
  for (const row of data) {
    const key = row.campus ?? "No campus set";
    let term = byTerm.get(row.termName);
    if (!term) {
      term = { name: row.termName };
      for (const campus of campuses) {
        term[campus] = 0;
      }
      byTerm.set(row.termName, term);
    }
    term[key] = (Number(term[key]) || 0) + row.enrolled;
  }

  const rows = Array.from(byTerm.values());

  return (
    <Box sx={{ width: "100%", height }} role="img" aria-label={question}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Legend />
          {campuses.map((campus, index) => (
            <Line
              key={campus}
              type="monotone"
              dataKey={campus}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
