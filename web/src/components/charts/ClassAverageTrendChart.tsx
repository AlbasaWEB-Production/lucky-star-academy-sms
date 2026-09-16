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
 * Average mark per class, per term.
 *
 * One line per class so a class that dips below another is visible at a glance.
 * The school is Primary 1–6, so at most six lines; if the lines get crowded the
 * per-class table below carries the same numbers.
 *
 * Marks recorded with no term are excluded, so a line does not blend terms.
 */
export default function ClassAverageTrendChart({
  data,
  height = 320,
}: {
  /** One row per (class, term). A class may be absent from a term if it has no marks. */
  data: { termName: string; className: string; avgMark: number | null }[];
  height?: number;
}) {
  const question = "Average mark per class, across terms";

  if (data.length === 0) {
    return (
      <Box sx={{ height, display: "grid", placeItems: "center" }}>
        <Typography variant="body2" color="text.secondary">
          {question} — nothing to chart yet.
        </Typography>
      </Box>
    );
  }

  const classes: string[] = [];
  for (const row of data) {
    if (!classes.includes(row.className)) {
      classes.push(row.className);
    }
  }

  // One row per term, with a key per class. A class with no marks that term is
  // omitted (so the line breaks rather than inventing an average), which is
  // honest: no marks, no average.
  const byTerm = new Map<string, Record<string, number | string>>();
  for (const row of data) {
    let term = byTerm.get(row.termName);
    if (!term) {
      term = { name: row.termName };
      byTerm.set(row.termName, term);
    }
    if (row.avgMark !== null) {
      term[row.className] = row.avgMark;
    }
  }

  const rows = Array.from(byTerm.values());

  return (
    <Box sx={{ width: "100%", height }} role="img" aria-label={question}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
          <Tooltip />
          <Legend />
          {classes.map((className, index) => (
            <Line
              key={className}
              type="monotone"
              dataKey={className}
              connectNulls
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
