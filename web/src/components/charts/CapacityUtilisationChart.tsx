"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Box, Typography } from "@mui/material";
import { CHART_COLORS } from "./tokens";

/**
 * Active pupils per class as a bar, with a line marking the class's seat
 * capacity.
 *
 * The bar is the honest pupil count, the line the ceiling the school set. A
 * class with no capacity set shows no line at its x position — "not set", not a
 * fabricated ceiling — and its utilisation is reported as a dash in the table.
 */
export default function CapacityUtilisationChart({
  data,
  height = 320,
}: {
  data: { className: string; pupilCount: number; capacity: number | null }[];
  height?: number;
}) {
  const question = "Capacity utilisation by class";

  if (data.length === 0) {
    return (
      <Box sx={{ height, display: "grid", placeItems: "center" }}>
        <Typography variant="body2" color="text.secondary">
          {question} — nothing to chart yet.
        </Typography>
      </Box>
    );
  }

  const maxCapacity = Math.max(0, ...data.map((row) => row.capacity ?? 0));
  const maxPupils = Math.max(0, ...data.map((row) => row.pupilCount));

  return (
    <Box sx={{ width: "100%", height }} role="img" aria-label={question}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="className" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            allowDecimals={false}
            domain={[0, Math.max(maxCapacity, maxPupils) || 4]}
          />
          <Tooltip />
          <Bar dataKey="pupilCount" name="Active pupils" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
          <Line
            type="monotone"
            dataKey="capacity"
            name="Capacity"
            stroke={CHART_COLORS[2]}
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 3 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
}
