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
 * A single-series bar chart that answers one question.
 *
 * The dashboards use this instead of ad-hoc `MarksBarChart` calls: the
 * `question` becomes the accessible name (`aria-label`) and the tooltip
 * title, the optional `unit` is appended to the value axis and to the direct
 * value labels, and the empty state names the question. `horizontal` renders
 * a per-category comparison (one bar per label); otherwise a vertical bar.
 *
 * A percentage unit caps the value axis at 100 so the bars read honestly.
 * Charts never animate on load.
 */
export default function QuestionBarChart({
  data,
  question,
  unit,
  color = CHART_COLORS[0],
  height = 300,
  horizontal = false,
}: {
  data: { name: string; value: number }[];
  question: string;
  unit?: string;
  color?: string;
  height?: number;
  horizontal?: boolean;
}) {
  const unitSuffix = unit ? ` ${unit}` : "";

  if (data.length === 0) {
    return (
      <Box sx={{ height, display: "grid", placeItems: "center" }}>
        <Typography variant="body2" color="text.secondary">
          {question} — nothing to chart yet.
        </Typography>
      </Box>
    );
  }

  const isPercent = unit === "%";
  const domain: [number | string, number | string] = isPercent ? [0, 100] : [0, "dataMax"];
  // Number-axis ticks carry the unit as well. Recharts' own `unit` axis prop is
  // concatenated with no separator, so the axis used to read `3students`;
  // formatting the tick keeps the space.
  const tickFormatter = (value: unknown) =>
    typeof value === "number" ? `${value}${unitSuffix}` : String(value);

  // The direct label on a bar, in the ordinary case.
  const labelFormatter = (value: unknown) =>
    typeof value === "number" ? `${value}${unitSuffix}` : String(value);

  // `LabelList` with `position="top"` splits its text on whitespace into two
  // stacked `<tspan>` lines, which drops the space and wraps the unit under the
  // value — `1` above `pupils` rather than `1 pupils`. A non-breaking space
  // still renders as a visible space but is not a word boundary, so the label
  // stays on one line. Confined to the vertical branch, which is the one that
  // wraps: the horizontal label is a single tspan and keeps an ordinary space.
  const topLabelFormatter = (value: unknown) =>
    typeof value === "number" ? `${value}${unit ? ` ${unit}` : ""}` : String(value);

  // A direct label sits *outside* its bar, so the chart has to reserve room for
  // it or the longest one is cut off at the edge (`3 stude`). Sized from the
  // longest label actually present rather than a fixed margin, so a longer unit
  // cannot quietly reintroduce the clipping.
  const valueLabelWidth =
    12 + Math.ceil(data.reduce((longest, d) => Math.max(longest, `${d.value}${unitSuffix}`.length), 0) * 7);

  return (
    <Box sx={{ width: "100%", height }} role="img" aria-label={question}>
      <ResponsiveContainer width="100%" height="100%">
        {horizontal ? (
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: valueLabelWidth, bottom: 8, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              domain={domain}
              tick={{ fontSize: 12 }}
              allowDecimals={false}
              tickFormatter={tickFormatter}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12 }}
              width={120}
            />
            <Tooltip formatter={(value) => [`${value}${unitSuffix}`, question]} />
            <Bar
              dataKey="value"
              fill={color}
              radius={[0, 4, 4, 0]}
              maxBarSize={28}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="value"
                position="right"
                formatter={labelFormatter}
                style={{ fontSize: 12, fill: "#1A1A1A" }}
              />
            </Bar>
          </BarChart>
        ) : (
          <BarChart data={data} margin={{ top: 20, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              interval={0}
              angle={data.length > 5 ? -20 : 0}
              textAnchor={data.length > 5 ? "end" : "middle"}
              height={data.length > 5 ? 70 : 40}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              allowDecimals={false}
              domain={domain}
              tickFormatter={tickFormatter}
            />
            <Tooltip formatter={(value) => [`${value}${unitSuffix}`, question]} />
            <Bar
              dataKey="value"
              fill={color}
              radius={[4, 4, 0, 0]}
              maxBarSize={64}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="value"
                position="top"
                formatter={topLabelFormatter}
                style={{ fontSize: 12, fill: "#1A1A1A" }}
              />
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
}
