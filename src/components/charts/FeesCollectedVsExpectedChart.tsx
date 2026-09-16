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
 * Fees expected versus collected, per term.
 *
 * The expected amount is drawn as a gold dashed target line and the collected
 * amount as green bars, so on screen a term whose bar falls short of the line
 * reads as "fees still owing". The value axis is money, so each tick is a
 * compact cedi label ("18.4k") rather than a raw pesewas integer - the same
 * convention the dashboard's attendance charts use for their units.
 */
export default function FeesCollectedVsExpectedChart({
  data,
  height = 320,
}: {
  data: { name: string; expected: number; collected: number }[];
  height?: number;
}) {
  const question = "Fees expected versus collected, per term";

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
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={tickFormatter} />
          <Tooltip
            formatter={(value: unknown, name: unknown) => {
              const label = name === "expected" ? "Expected" : "Collected";
              return [formatCedis(Number(value)), label];
            }}
          />
          <Legend />
          <Bar
            dataKey="collected"
            name="Collected"
            fill={CHART_COLORS[0]}
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
            isAnimationActive={false}
          />
          <Line
            dataKey="expected"
            name="Expected"
            stroke={CHART_COLORS[2]}
            strokeDasharray="6 4"
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
