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
 * Retained vs pupils who left, per term.
 *
 * Two bars per term — the ones who stayed (green) and the ones who left (gold) —
 * so the eye can see a term where the "left" bar grows. Counted in the term
 * where a pupil's status last changed; a pupil with no status change yet is
 * omitted, so a blank bar is an honest "no changes recorded this term".
 */
export default function RetentionDropoutChart({
  data,
  height = 320,
}: {
  data: { termName: string; retained: number; leftSchool: number }[];
  height?: number;
}) {
  const question = "Pupils retained versus who left, per term";

  if (data.length === 0) {
    return (
      <Box sx={{ height, display: "grid", placeItems: "center" }}>
        <Typography variant="body2" color="text.secondary">
          {question} — nothing to chart yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", height }} role="img" aria-label={question}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="termName" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="retained"
            name="Retained"
            fill={CHART_COLORS[0]}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
            isAnimationActive={false}
          />
          <Bar
            dataKey="leftSchool"
            name="Left school"
            fill={CHART_COLORS[2]}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
