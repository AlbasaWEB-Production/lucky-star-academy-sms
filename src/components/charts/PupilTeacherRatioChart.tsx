"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Box, Typography } from "@mui/material";
import { CHART_COLORS } from "./tokens";

/**
 * Pupils per teacher, one bar per class.
 *
 * The height is the ratio (active pupils over assigned teachers). A class with
 * no teacher has a null ratio, so no bar is drawn there — an honest "gap", not
 * a fabricated 0 — and the table next to it carries the 0-teacher count. Bars
 * are coloured by campus so a school split across its campuses reads at a
 * glance; a legend appears when more than one campus is present.
 */
export default function PupilTeacherRatioChart({
  data,
  height = 320,
}: {
  data: { className: string; campus: string | null; ratio: number | null }[];
  height?: number;
}) {
  const question = "Pupils per teacher, by class";

  if (data.length === 0) {
    return (
      <Box sx={{ height, display: "grid", placeItems: "center" }}>
        <Typography variant="body2" color="text.secondary">
          {question} — nothing to chart yet.
        </Typography>
      </Box>
    );
  }

  const campuses = [...new Set(data.map((row) => row.campus).filter(Boolean))];

  return (
    <Box sx={{ width: "100%", height }} role="img" aria-label={question}>
      {campuses.length > 1 ? (
        <Box sx={{ display: "flex", gap: 2, mb: 1, flexWrap: "wrap" }}>
          {campuses.map((campus, index) => (
            <Box key={campus} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                component="span"
                aria-hidden
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: 0.5,
                  bgcolor: CHART_COLORS[index % CHART_COLORS.length],
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {campus}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null}

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="className" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals />
          <Tooltip />
          <Bar
            dataKey="ratio"
            name="Pupils per teacher"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
            isAnimationActive={false}
          >
            {data.map((row, index) => (
              <Cell
                key={index}
                fill={
                  row.campus && campuses.length > 1
                    ? CHART_COLORS[campuses.indexOf(row.campus) % CHART_COLORS.length]
                    : CHART_COLORS[0]
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
