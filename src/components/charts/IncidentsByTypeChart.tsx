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
import { incidentTypeLabel } from "@/lib/incidents";
import { CHART_COLORS } from "./tokens";

/**
 * Incidents by type, one horizontal bar per type, with the count written beside
 * each bar.
 *
 * The bar length is the number of incidents recorded against that type. Every
 * type row is drawn, so a type with zero incidents still appears as an empty
 * bar — the chart keeps its full six-bar shape rather than skipping a silent
 * type. The data comes from `v_incidents_by_type`, which emits all six types
 * even when a type holds nothing.
 */
export default function IncidentsByTypeChart({
  data,
  height = 320,
}: {
  data: { incidentType: string; incidentCount: number }[];
  height?: number;
}) {
  const question = "Incidents by type";

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
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 40, bottom: 8, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="incidentType"
            tick={{ fontSize: 12 }}
            tickFormatter={(value: string) => incidentTypeLabel(value)}
            width={110}
          />
          <Tooltip
            formatter={(value) => [
              `${value} incident${Number(value) === 1 ? "" : "s"}`,
              "Incidents",
            ]}
          />
          <Bar
            dataKey="incidentCount"
            name="Incidents"
            fill={CHART_COLORS[0]}
            radius={[0, 4, 4, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="incidentCount"
              position="right"
              formatter={(value) => `${value}`}
              style={{ fill: "text.secondary", fontSize: 12 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
