"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Box, Typography } from "@mui/material";
import { CHART_COLORS } from "./tokens";

/**
 * School composition — Students, Teachers and Administrators as a three-bar
 * horizontal comparison. Administrators are always the third group so the
 * school's people are counted as one family.
 *
 * Each bar carries a direct value label; colour is never the only carrier.
 * Charts never animate on load.
 */
export default function PeopleBreakdown({
  students,
  teachers,
  admins,
  height = 240,
}: {
  students: number;
  teachers: number;
  admins: number;
  height?: number;
}) {
  const data = [
    { name: "Students", value: students, color: CHART_COLORS[0] },
    { name: "Teachers", value: teachers, color: CHART_COLORS[1] },
    { name: "Administrators", value: admins, color: CHART_COLORS[2] },
  ];

  if (data.every((entry) => entry.value === 0)) {
    return (
      <Box sx={{ height, display: "grid", placeItems: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No people recorded yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{ width: "100%", height }}
      role="img"
      aria-label="Students, teachers and administrators"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 32, bottom: 8, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
          <Tooltip />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={32}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              style={{ fontSize: 12, fill: "#1A1A1A" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
