"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Box, Typography } from "@mui/material";
import { CHART_COLORS } from "./tokens";

/**
 * New enrolments per class, stacked by the intake term the pupil targeted.
 *
 * Each bar is a class; its segments are the terms enrolled leads were assigned
 * to, so one chart answers both "which class is taking pupils" and "into which
 * intake". A segment is only drawn where an enrolled lead recorded that class
 * and term — no invented terms, so a class with none enrolled simply has no bar.
 */
export default function NewEnrolmentsByIntakeChart({
  data,
  height = 320,
}: {
  data: { className: string; termName: string | null; enrolled: number }[];
  height?: number;
}) {
  const question = "New enrolments by class and intake term";

  if (data.length === 0) {
    return (
      <Box sx={{ height, display: "grid", placeItems: "center" }}>
        <Typography variant="body2" color="text.secondary">
          {question} — nothing to chart yet.
        </Typography>
      </Box>
    );
  }

  const classNames: string[] = [];
  const terms: string[] = [];
  for (const row of data) {
    if (!classNames.includes(row.className)) {
      classNames.push(row.className);
    }
    const term = row.termName ?? "No term set";
    if (!terms.includes(term)) {
      terms.push(term);
    }
  }
  classNames.sort();

  // One row per class with a numeric key per term, so the stacked bars split by
  // intake term.
  const byClass = new Map<string, Record<string, number | string>>();
  for (const row of data) {
    let entry = byClass.get(row.className);
    if (!entry) {
      entry = { name: row.className };
      byClass.set(row.className, entry);
    }
    const term = row.termName ?? "No term set";
    entry[term] = Number(entry[term] ?? 0) + row.enrolled;
  }

  const rows = classNames.map((name) => byClass.get(name) as Record<string, number | string>);

  return (
    <Box sx={{ width: "100%", height }} role="img" aria-label={question}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          {terms.length > 1 ? <Legend /> : null}
          {terms.map((term, index) => (
            <Bar
              key={term}
              dataKey={term}
              stackId="a"
              fill={CHART_COLORS[index % CHART_COLORS.length]}
              radius={index === terms.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              maxBarSize={40}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
