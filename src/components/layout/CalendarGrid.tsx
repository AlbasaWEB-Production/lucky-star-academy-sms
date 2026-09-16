"use client";

import Link from "@/components/NextLink";
import { Box, Typography, alpha, useTheme } from "@mui/material";
import type { CalendarDay } from "@/lib/data/header";
import type { UserRole } from "@/lib/supabase/database.types";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Mini month grid for the header calendar popover.
 *
 * Only days carrying real records are marked; nothing is fabricated. Today is
 * filled in the school green, a day with records gets a light tint, and a
 * marked day links to the page that handles that kind of record.
 */
export default function CalendarGrid({
  calendar,
  today,
  role,
}: {
  calendar: CalendarDay[];
  today: string;
  role: UserRole;
}) {
  const theme = useTheme();

  const [y, m] = today.split("-").map(Number);
  const monthLabel = new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const firstWeekday = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();

  const byDate = new Map(calendar.map((entry) => [entry.date, entry]));

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  return (
    <Box sx={{ width: 300, maxWidth: "calc(100vw - 48px)", p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {monthLabel}
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
        {WEEKDAYS.map((weekday) => (
          <Typography
            key={weekday}
            variant="caption"
            color="text.secondary"
            sx={{ textAlign: "center" }}
          >
            {weekday}
          </Typography>
        ))}

        {cells.map((day, index) => {
          if (day === null) {
            return <Box key={`empty-${index}`} />;
          }

          const dateStr = `${y}-${pad(m)}-${pad(day)}`;
          const record = byDate.get(dateStr);
          const isToday = dateStr === today;

          const cell = (
            <Box
              sx={{
                height: 32,
                display: "grid",
                placeItems: "center",
                borderRadius: 1,
                fontSize: 12,
                ...(isToday
                  ? { bgcolor: "primary.main", color: "#ffffff", fontWeight: 700 }
                  : {}),
                ...(record && !isToday
                  ? { bgcolor: alpha(theme.palette.primary.main, 0.12) }
                  : {}),
              }}
            >
              {day}
            </Box>
          );

          if (!record) {
            return <Box key={dateStr}>{cell}</Box>;
          }

          const href = record.kinds.includes("notice")
            ? `/${role}/notices`
            : `/${role}/attendance`;

          return (
            <Link
              key={dateStr}
              href={href}
              style={{ textDecoration: "none", color: "inherit", display: "block" }}
            >
              {cell}
            </Link>
          );
        })}
      </Box>

      <Box sx={{ display: "flex", gap: 2, mt: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main" }} />
          <Typography variant="caption" color="text.secondary">
            Today
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.primary.main, 0.3),
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Has records
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
