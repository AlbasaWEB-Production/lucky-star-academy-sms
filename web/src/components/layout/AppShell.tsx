"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "@/components/NextLink";
import { usePathname } from "next/navigation";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import EventNoteIcon from "@mui/icons-material/EventNote";
import GradingIcon from "@mui/icons-material/Grading";
import CampaignIcon from "@mui/icons-material/Campaign";
import ReportGmailerrorredIcon from "@mui/icons-material/ReportGmailerrorred";

import SchoolLogo from "@/components/ui/SchoolLogo";
import { signOutAction } from "@/lib/auth/actions";
import { DISPLAY_FONT, DRAWER_WIDTH } from "@/theme";
import { NAV_SECTIONS } from "./nav";
import type { UserRole } from "@/lib/supabase/database.types";
import type { HeaderData } from "@/lib/data/header";
import NotificationFeed from "./NotificationFeed";
import CalendarGrid from "./CalendarGrid";

/** Small icon per sidebar route, so the nav reads icon+label like the reference. */
const NAV_ICON: Record<string, ReactNode> = {
  "/admin/dashboard": <DashboardIcon fontSize="inherit" />,
  "/teacher/dashboard": <DashboardIcon fontSize="inherit" />,
  "/student/dashboard": <DashboardIcon fontSize="inherit" />,
  "/admin/profile": <PersonIcon fontSize="inherit" />,
  "/teacher/profile": <PersonIcon fontSize="inherit" />,
  "/student/profile": <PersonIcon fontSize="inherit" />,
  "/admin/students": <GroupsIcon fontSize="inherit" />,
  "/teacher/students": <GroupsIcon fontSize="inherit" />,
  "/admin/teachers": <SchoolIcon fontSize="inherit" />,
  "/admin/admins": <SchoolIcon fontSize="inherit" />,
  "/admin/classes": <MenuBookIcon fontSize="inherit" />,
  "/teacher/classes": <MenuBookIcon fontSize="inherit" />,
  "/admin/subjects": <MenuBookIcon fontSize="inherit" />,
  "/student/subjects": <MenuBookIcon fontSize="inherit" />,
  "/admin/attendance": <EventNoteIcon fontSize="inherit" />,
  "/teacher/attendance": <EventNoteIcon fontSize="inherit" />,
  "/student/attendance": <EventNoteIcon fontSize="inherit" />,
  "/admin/exam-marks": <GradingIcon fontSize="inherit" />,
  "/teacher/exam-marks": <GradingIcon fontSize="inherit" />,
  "/admin/notices": <CampaignIcon fontSize="inherit" />,
  "/teacher/notices": <CampaignIcon fontSize="inherit" />,
  "/student/notices": <CampaignIcon fontSize="inherit" />,
  "/admin/complaints": <ReportGmailerrorredIcon fontSize="inherit" />,
  "/student/complaints": <ReportGmailerrorredIcon fontSize="inherit" />,
};

/**
 * Dashboard shell: top bar with real jobs, role-aware sidebar, and the
 * account menu.
 *
 * The top bar carries information, not chrome: today's date, a notification
 * bell with a role-aware feed, a calendar showing the days that actually hold
 * records, and the account menu. On the smallest screens the date, bell,
 * calendar and account collapse into a single "More" menu so the bar stays one
 * line. The feed and calendar are computed on the server (`getHeaderData`) and
 * arrive here as plain props - this client component never touches the
 * database.
 */
export default function AppShell({
  role,
  fullName,
  email,
  schoolName,
  headerData,
  children,
}: {
  role: UserRole;
  fullName: string;
  email: string | null;
  schoolName: string;
  headerData: HeaderData;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [calendarAnchor, setCalendarAnchor] = useState<null | HTMLElement>(null);

  const moreBtnRef = useRef<HTMLButtonElement>(null);

  const sections = NAV_SECTIONS[role];

  const [ty, tm, td] = headerData.today.split("-").map(Number);
  const todayLabel = new Date(ty, tm - 1, td).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH, height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar sx={{ px: 2 }}>
        <SchoolLogo decorative sizes="160px" sx={{ height: 40 }} />
      </Toolbar>

      <Divider />

      <Box component="nav" sx={{ flex: 1, overflowY: "auto", py: 1 }}>
        {sections.map((section, index) => (
          <Box key={section.heading ?? `section-${index}`} sx={{ mb: 1 }}>
            {section.heading ? (
              <Typography
                variant="overline"
                sx={{ px: 2.5, pt: 1, display: "block", color: "text.secondary" }}
              >
                {section.heading}
              </Typography>
            ) : null}

            <List dense disablePadding>
              {section.items.map((item) => {
                const selected = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <ListItemButton
                    key={item.href}
                    component={Link}
                    href={item.href}
                    selected={selected}
                    onClick={() => setMobileOpen(false)}
                    sx={{
                      mx: 1.5,
                      my: 0.25,
                      borderRadius: 999,
                      px: 1.5,
                      "&.Mui-selected": {
                        backgroundColor: "primary.main",
                        color: "primary.contrastText",
                        "&:hover": { backgroundColor: "primary.dark" },
                        "& .MuiListItemIcon-root": { color: "#ffffff" },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{ minWidth: 32, color: "text.secondary", fontSize: 20 }}
                    >
                      {NAV_ICON[item.href] ?? <PersonIcon fontSize="inherit" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      slotProps={{
                        primary: { variant: "body2", sx: { fontWeight: selected ? 700 : 500 } },
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  );

  const notificationCount = headerData.notifications.length;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "background.default" }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper",
        }}
      >
        <Toolbar sx={{ gap: 1.5 }}>
          <IconButton
            edge="start"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <SchoolLogo decorative sizes="140px" sx={{ height: 36, flexShrink: 0 }} />

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              noWrap
              sx={{ fontFamily: DISPLAY_FONT, fontWeight: 700, lineHeight: 1.2 }}
            >
              {schoolName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
              {role.charAt(0).toUpperCase() + role.slice(1)} portal
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }} />

          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            {todayLabel}
          </Typography>

          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <IconButton onClick={(event) => setNotifAnchor(event.currentTarget)} aria-label="Notifications">
              <Badge badgeContent={notificationCount} color="error" invisible={notificationCount === 0}>
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <IconButton onClick={(event) => setCalendarAnchor(event.currentTarget)} aria-label="Calendar">
              <CalendarMonthIcon />
            </IconButton>

            <IconButton onClick={(event) => setMenuAnchor(event.currentTarget)} aria-label="Account">
              <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main", fontSize: 15 }}>
                {initials || "?"}
              </Avatar>
            </IconButton>
          </Box>

          {/* Smallest screens: collapse the date, bell, calendar and account
              into one "More" menu so the bar stays a single line. */}
          <IconButton
            ref={moreBtnRef}
            onClick={() => setMoreOpen(true)}
            aria-label="More options"
            sx={{ display: { xs: "flex", sm: "none" } }}
          >
            <MoreHorizIcon />
          </IconButton>

          <Menu
            anchorEl={moreBtnRef.current}
            open={moreOpen}
            onClose={() => setMoreOpen(false)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem
              onClick={() => {
                setMoreOpen(false);
                setNotifAnchor(moreBtnRef.current);
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <NotificationsIcon fontSize="small" />
              </ListItemIcon>
              Notifications
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMoreOpen(false);
                setCalendarAnchor(moreBtnRef.current);
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CalendarMonthIcon fontSize="small" />
              </ListItemIcon>
              Calendar
            </MenuItem>
            <MenuItem component={Link} href={`/${role}/profile`} onClick={() => setMoreOpen(false)}>
              My profile
            </MenuItem>
            <form action={signOutAction}>
              <MenuItem component="button" type="submit" sx={{ width: "100%" }}>
                Sign out
              </MenuItem>
            </form>
          </Menu>

          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <Box sx={{ px: 2, py: 1, maxWidth: 240 }}>
              <Typography variant="subtitle2" noWrap>
                {fullName}
              </Typography>
              {email ? (
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                  {email}
                </Typography>
              ) : null}
            </Box>

            <Divider />

            <MenuItem component={Link} href={`/${role}/profile`} onClick={() => setMenuAnchor(null)}>
              My profile
            </MenuItem>

            {/*
              Sign-out is a form post to a Server Action rather than a link, so
              the session is cleared on the server and the auth cookies are
              removed from the response.
            */}
            <form action={signOutAction}>
              <MenuItem component="button" type="submit" sx={{ width: "100%" }}>
                Sign out
              </MenuItem>
            </form>
          </Menu>

          <Popover
            open={Boolean(notifAnchor)}
            anchorEl={notifAnchor}
            onClose={() => setNotifAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <NotificationFeed notifications={headerData.notifications} />
          </Popover>

          <Popover
            open={Boolean(calendarAnchor)}
            anchorEl={calendarAnchor}
            onClose={() => setCalendarAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <CalendarGrid calendar={headerData.calendar} today={headerData.today} role={role} />
          </Popover>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" } }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              borderRight: "1px solid",
              borderColor: "divider",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3 }, mt: 8 }}>
        {children}
      </Box>
    </Box>
  );
}
