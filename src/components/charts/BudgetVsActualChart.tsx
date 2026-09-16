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
import { formatCedis, formatCedisCompact } from "@/lib/money";

/**
 * Budget versus actual spending by cost centre.
 *
 * For each cost centre a budgeted bar (sage, the quieter green) sits beside an
 * actual bar (gold), so a centre whose actual bar overhangs its budget bar is
 * overspending at a glance. The cost centres are the school's own fixed list
 * (Teaching, Administration, Utilities, and so on), so the axis is short and
 * the chart stays readable.
 */
export default function BudgetVsActualChart({
  data,
  height = 320,
}: {
  data: { name: string; budget: number; actual: number }[];
  height?: number;
}) {
  const question = "Budget versus actual spending, by cost centre";

  if (data.length === 0) {
    return (
      <Box sx={{ height, display: "grid", placeItems: "center" }}>
        <Typography variant="body2" color="text.secondary">
          {question} — nothing to chart yet.
        </Typography>
      </Box>
    );
  }

  const tickFormatter = (value: unknown) =>
    typeof value === "number" ? formatCedisCompact(value) : String(value);

  return (
    <Box sx={{ width: "100%", height }} role="img" aria-label={question}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={tickFormatter} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={140} />
          <Tooltip
            formatter={(value: unknown, name: unknown) => {
              const label = name === "budget" ? "Budget" : "Actual";
              return [formatCedis(Number(value)), label];
            }}
          />
          <Legend />
          <Bar dataKey="budget" name="Budget" fill={CHART_COLORS[3]} radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive={false} />
          <Bar dataKey="actual" name="Actual" fill={CHART_COLORS[2]} radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
