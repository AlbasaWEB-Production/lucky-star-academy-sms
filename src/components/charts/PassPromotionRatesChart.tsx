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

/**
 * Pass rate and promotion rate per term, drawn against the configured pass mark.
 *
 * The pass mark is a dashed gold reference line across the same value axis, so a
 * bar that ends short of the line reads as "that class term fell below the
 * school's pass mark". Pass rate is marks >= pass mark; promotion rate is pupils
 * whose term average meets it.
 */
export default function PassPromotionRatesChart({
  data,
  passMark,
  height = 320,
}: {
  data: {
    termName: string;
    passRatePercent: number | null;
    promotionRatePercent: number | null;
  }[];
  passMark: number;
  height?: number;
}) {
  const question = "Pass and promotion rates per term, against the pass mark";

  if (data.length === 0) {
    return (
      <Box sx={{ height, display: "grid", placeItems: "center" }}>
        <Typography variant="body2" color="text.secondary">
          {question} — nothing to chart yet.
        </Typography>
      </Box>
    );
  }

  // Inject the constant pass mark as a per-row field so the dashed reference
  // line renders as an ordinary series (and appears in the legend), the same
  // way the fees chart draws its expected line.
  const rows = data.map((row) => ({ ...row, passMark }));

  return (
    <Box sx={{ width: "100%", height }} role="img" aria-label={question}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="termName" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
          <Tooltip
            formatter={(value: unknown, name: unknown) =>
              name === "passMark" ? [`${value}`, "Pass mark"] : [`${value}%`, name as string]
            }
          />
          <Legend />
          <Bar
            dataKey="passRatePercent"
            name="Pass rate"
            fill={CHART_COLORS[0]}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
            isAnimationActive={false}
          />
          <Bar
            dataKey="promotionRatePercent"
            name="Promotion rate"
            fill={CHART_COLORS[1]}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
            isAnimationActive={false}
          />
          <Line
            dataKey="passMark"
            name={`Pass mark (${passMark})`}
            stroke={CHART_COLORS[2]}
            strokeDasharray="6 4"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            type="monotone"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
}
