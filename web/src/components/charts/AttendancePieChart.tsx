"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Box, Typography } from "@mui/material";
import { CHART_COLORS } from "./tokens";

/**
 * Present vs absent breakdown.
 *
 * Replaces CustomPieChart.js from the legacy app. Recharts needs a client
 * component and an explicitly sized container, since it measures its parent.
 */
export default function AttendancePieChart({
  present,
  absent,
  height = 260,
}: {
  present: number;
  absent: number;
  height?: number;
}) {
  const total = present + absent;

  if (total === 0) {
    return (
      <Box sx={{ height, display: "grid", placeItems: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No attendance recorded yet.
        </Typography>
      </Box>
    );
  }

  const data = [
    { name: "Present", value: present, color: CHART_COLORS[0] },
    { name: "Absent", value: absent, color: "#C62828" },
  ];

  return (
    <Box sx={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={24} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}
