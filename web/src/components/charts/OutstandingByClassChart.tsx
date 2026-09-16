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
 * Outstanding fees by class, as a stacked composition.
 *
 * Each class's bar is split into the portion already collected (green, bottom)
 * and the portion still outstanding (gold, top), so the total bar height is the
 * amount expected. A class with a tall gold segment is where the money is owed.
 * The category axis holds class names, so the chart reads top-down as a class
 * list.
 */
export default function OutstandingByClassChart({
  data,
  height = 320,
}: {
  data: { name: string; collected: number; outstanding: number }[];
  height?: number;
}) {
  const question = "Fees outstanding by class, split into collected and owing";

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
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            tickFormatter={tickFormatter}
          />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
          <Tooltip
            formatter={(value: unknown, name: unknown) => {
              const label = name === "collected" ? "Collected" : "Outstanding";
              return [formatCedis(Number(value)), label];
            }}
          />
          <Legend />
          <Bar
            dataKey="collected"
            name="Collected"
            stackId="fees"
            fill={CHART_COLORS[0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="outstanding"
            name="Outstanding"
            stackId="fees"
            fill={CHART_COLORS[2]}
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
