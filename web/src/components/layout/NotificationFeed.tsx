"use client";

import Link from "@/components/NextLink";
import { Box, Divider, Typography } from "@mui/material";
import type { HeaderNotice } from "@/lib/data/header";

/**
 * Role-aware notification feed, rendered inside the header bell popover.
 *
 * Each item is a link to the page that deals with it. The footer states the
 * window so "new" is not a mystery. Real rows only - an empty feed shows
 * "Nothing new", never a fake count.
 */
export default function NotificationFeed({
  notifications,
}: {
  notifications: HeaderNotice[];
}) {
  return (
    <Box sx={{ width: 320, maxWidth: "calc(100vw - 48px)", py: 1 }}>
      <Typography variant="subtitle2" sx={{ px: 2, pb: 1 }}>
        Notifications
      </Typography>
      <Divider />

      {notifications.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
          Nothing new.
        </Typography>
      ) : (
        notifications.map((item) => (
          <Box key={item.id} sx={{ "&:hover": { backgroundColor: "action.hover" } }}>
            <Link
              href={item.href}
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "block",
                padding: "10px 16px",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {item.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                View
              </Typography>
            </Link>
          </Box>
        ))
      )}

      <Divider />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ px: 2, pt: 1, display: "block" }}
      >
        New means the last 7 days.
      </Typography>
    </Box>
  );
}
