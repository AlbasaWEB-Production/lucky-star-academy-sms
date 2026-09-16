"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Box, Typography } from "@mui/material";
import { CHART_COLORS } from "./tokens";

/**
 * Each teacher's attendance rate over the current term, one bar per teacher.
 *
 * The rate is present days over recorded days for the term window the view
 * resolves exactly as `fn_at_risk_pupils()` does. A teacher with no recorded
 * days has a null rate and therefore no bar — the table beside it shows those
 * teachers under "no records yet". Bars are shaded by reliability band (a
 * healthy 80%+ is the brand green, 60–79% the gold, below 60% the sage) so a
 * head can spot a teacher who needs a conversation; the exact figure always
 * sits in the table, so colour is never the only signal.
 */
export default function TeacherAttendanceRateChart({
  data,
  height = 320,
}: {
  data: { teacherName: string; ratePercent: number | null }[];
  height?: number;
}) {
  const question = "Teacher attendance over the current term";

  if (data.length === 0) {
    return (
      <Box sx={{ height, display: "grid", placeItems: "center" }}>
        <Typography variant="body2" color="text.secondary">
          {question} — nothing to chart yet.
        </Typography>
      </Box>
    );
  }

  function band(rate: number | null): string {
    if (rate === null) {
      return CHART_COLORS[3];
    }
    if (rate >= 80) {
      return CHART_COLORS[0];
    }
    if (rate >= 60) {
      return CHART_COLORS[2];
    }
    return CHART_COLORS[3];
  }

  return (
    <Box sx={{ width: "100%", height }} role="img" aria-label={question}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="teacherName" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} allowDecimals />
          <Tooltip />
          <Bar
            dataKey="ratePercent"
            name="Attendance rate"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
            isAnimationActive={false}
          >
            {data.map((row, index) => (
              <Cell key={index} fill={band(row.ratePercent)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
