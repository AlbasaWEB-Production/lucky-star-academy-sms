import { Box, Paper, Typography } from "@mui/material";

/**
 * A notice as a reading card, not a stat.
 *
 * Per DESIGN.md Decision 5, a notice card carries a date rail on the left and
 * the title and text to the right, so it reads as a message rather than a
 * metric tile. Used on the teacher and student notice portals, where the card
 * *is* the notice - there is no separate detail page - so the full text is
 * shown, not a truncated excerpt.
 *
 * This is a presentational Server Component; the caller owns the data shape.
 */
export default function NoticeCard({
  notice,
}: {
  notice: { id: string; title: string; date: string; details: string };
}) {
  const date = new Date(notice.date);
  const day = date.getDate();
  const month = date.toLocaleDateString(undefined, { month: "short" });
  const year = date.getFullYear();

  return (
    <Paper
      variant="outlined"
      sx={{ display: "flex", overflow: "hidden", borderRadius: "20px" }}
    >
      <Box
        aria-hidden
        sx={{
          flexShrink: 0,
          width: 92,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          p: 2,
          borderRight: "1px solid",
          borderColor: "divider",
          bgcolor: "rgba(20, 123, 69, 0.06)",
        }}
      >
        {/* The day of month is a number, not a heading — opt it out of the
            theme's variant mapping so the big bold numeral is a `<div>`. */}
        <Typography variant="h5" component="div" sx={{ color: "primary.main", lineHeight: 1 }}>
          {day}
        </Typography>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ lineHeight: 1.4, mt: 0.5 }}
        >
          {month} {year}
        </Typography>
      </Box>

      <Box sx={{ p: 2.5, flex: 1, minWidth: 0 }}>
        <Typography variant="h6">{notice.title}</Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.75, whiteSpace: "pre-wrap" }}
        >
          {notice.details}
        </Typography>
      </Box>
    </Paper>
  );
}
