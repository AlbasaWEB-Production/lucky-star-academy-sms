"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, TextField } from "@mui/material";

import { createNoticeAction, updateNoticeAction } from "@/lib/actions/content";
import { initialFormResult } from "@/lib/actions/result";
import type { NoticeSummary } from "@/lib/data/queries";

/**
 * Notice editor, used by both the add and the edit route.
 *
 * Passing a `notice` switches the form into edit mode: the id travels as a
 * hidden field and the submit goes to `updateNoticeAction`. Without one the
 * form creates a new notice. Both actions `redirect()` back to the notice list
 * on success, so the only state this component has to report is an error.
 *
 * The legacy `AddNotice.js` form required a date. Here the field is optional,
 * because the `notices.date` column already defaults to today and forcing an
 * admin to pick a date to publish "now" was pure friction.
 */
export default function NoticeForm({ notice }: { notice?: NoticeSummary }) {
  const isEdit = Boolean(notice);

  const [state, formAction, isPending] = useActionState(
    isEdit ? updateNoticeAction : createNoticeAction,
    initialFormResult,
  );

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 640 }}>
      {notice ? <input type="hidden" name="noticeId" value={notice.id} /> : null}

      <TextField
        name="title"
        label="Title"
        defaultValue={notice?.title ?? ""}
        required
        fullWidth
        autoFocus
        margin="normal"
      />

      <TextField
        name="details"
        label="Details"
        defaultValue={notice?.details ?? ""}
        required
        fullWidth
        multiline
        minRows={6}
        margin="normal"
        helperText="The full notice text. Everyone in the school reads this."
      />

      <TextField
        name="date"
        label="Date"
        type="date"
        // Postgres hands back a `YYYY-MM-DD` string, which is exactly the value
        // a date input expects. The slice guards against a fuller timestamp.
        defaultValue={notice?.date ? notice.date.slice(0, 10) : ""}
        fullWidth
        margin="normal"
        slotProps={{ inputLabel: { shrink: true } }}
        helperText="Leave blank to publish with today's date."
      />

      {state.error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      <Button type="submit" variant="contained" size="large" disabled={isPending} sx={{ mt: 3 }}>
        {isPending ? (
          <CircularProgress size={24} color="inherit" />
        ) : isEdit ? (
          "Save changes"
        ) : (
          "Publish notice"
        )}
      </Button>
    </Box>
  );
}
