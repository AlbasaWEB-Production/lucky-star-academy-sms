"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Box, Typography } from "@mui/material";
import { CHART_COLORS } from "./tokens";

/**
 * Incidents per 100 active pupils by class, one vertical bar per class.
 *
 * The bar is the rate — incidents per hundred active pupils, rounded to one
 * decimal. A class with no active pupils has a null `perHundred` and shows no
 * bar at its x position: "not set", never a fabricated 0. A class with pupils
 * but no incidents shows a genuine 0. Data comes from
 * `v_incidents_per_hundred_by_class`, which emits every class so the chart keeps
 * its full shape.
 */
export default function IncidentsPerHundredByClassChart({
  data,
  height = 320,
}: {
  data: { className: string; perHundred: number | null }[];
  height?: number;
}) {
  const question = "Incidents per hundred pupils by class";

  if (data.length === 0) {
    return (
      <Box sx={{ height, display: "grid", placeItems: "center" }}>
        <Typography variant="body2" color="text.secondary">
          {question} — nothing to chart yet.
        </Typography>
      </Box>
    );
  }

  const maxRate = Math.max(0, ...data.map((row) => row.perHundred ?? 0));

  return (
    <Box sx={{ width: "100%", height }} role="img" aria-label={question}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="className" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} domain={[0, maxRate || 4]} />
          <Tooltip
            formatter={(value) => [
              value === null || value === undefined
                ? "not set"
                : `${Number(value)} per 100 pupils`,
              "Incidents",
            ]}
          />
          <Bar
            dataKey="perHundred"
            name="Per 100 pupils"
            fill={CHART_COLORS[0]}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="perHundred"
              position="top"
              formatter={(value) =>
                value === null || value === undefined ? "—" : `${Number(value)}`
              }
              style={{ fill: "text.secondary", fontSize: 12 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
