"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Box, Typography } from "@mui/material";
import { CHART_COLORS } from "./tokens";
import { formatCedis, formatCedisCompact } from "@/lib/money";

/**
 * Monthly cash position.
 *
 * Income (green bars) and expenses (gold bars) are drawn side by side for each
 * month, with the running cash balance overlaid as a line. The running balance
 * is what a bursar actually wants to see, so it is the series that carries the
 * data point dots; the monthly bars show the individual movements behind it.
 */
export default function CashPositionChart({
  data,
  height = 320,
}: {
  data: { name: string; income: number; expenses: number; runningBalance: number }[];
  height?: number;
}) {
  const question = "Monthly cash position: income, expenses and running balance";

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
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={tickFormatter} />
          <Tooltip
            formatter={(value: unknown, name: unknown) => {
              const label =
                name === "income" ? "Income" : name === "expenses" ? "Expenses" : "Running balance";
              return [formatCedis(Number(value)), label];
            }}
          />
          <Legend />
          <Bar dataKey="income" name="Income" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          <Bar dataKey="expenses" name="Expenses" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          <Line
            dataKey="runningBalance"
            name="Running balance"
            stroke={CHART_COLORS[1]}
            strokeWidth={2}
            dot={{ r: 3 }}
            isAnimationActive={false}
            type="monotone"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
}
