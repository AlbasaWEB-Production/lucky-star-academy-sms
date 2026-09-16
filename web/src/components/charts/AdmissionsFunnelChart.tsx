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
import { stageLabel } from "@/lib/admissions";
import { CHART_COLORS } from "./tokens";

/**
 * Admissions funnel, one horizontal bar per stage, with the conversion share of
 * all leads written beside each bar.
 *
 * The bar length is the number of leads currently sitting in that stage; the
 * percentage beside it is that count as a share of every lead. Every stage row
 * is drawn, so a stage with zero leads still appears as an empty bar — the
 * funnel keeps its full five-bar shape rather than skipping a silent stage.
 */
export default function AdmissionsFunnelChart({
  data,
  height = 320,
}: {
  data: { stage: string; leads: number; conversionPercent: number }[];
  height?: number;
}) {
  const question = "Admissions funnel by stage";

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
          margin={{ top: 8, right: 56, bottom: 8, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="stage"
            tick={{ fontSize: 12 }}
            tickFormatter={(value: string) => stageLabel(value)}
            width={90}
          />
          <Tooltip formatter={(value) => [`${value} lead${Number(value) === 1 ? "" : "s"}`, "Leads"]} />
          <Bar
            dataKey="leads"
            name="Leads"
            fill={CHART_COLORS[0]}
            radius={[0, 4, 4, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="conversionPercent"
              position="right"
              formatter={(value) => `${value}%`}
              style={{ fill: "text.secondary", fontSize: 12 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
