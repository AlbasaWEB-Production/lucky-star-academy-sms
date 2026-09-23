import Link from "@/components/NextLink";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";

import ProfileNameForm from "@/components/account/ProfileNameForm";
import PageHeader from "@/components/ui/PageHeader";
import { roleLabel } from "@/lib/auth/roles";
import { loadShellContext } from "@/lib/auth/shell-context";

export const metadata = {
  title: "My profile",
};

/**
 * The accountant's own profile.
 *
 * `loadShellContext("accountant")` is used rather than `requireRoleWithTenant`
 * alone because it also returns the `profiles.full_name` / `profiles.email`
 * values. `updateOwnNameAction` writes to `profiles` only, so the JWT copy in
 * `session.fullName` goes stale until the token refreshes - reading the row
 * keeps the name correct immediately after a rename. The shell context calls
 * `requireRoleWithTenant("accountant")` internally, so the page stays guarded
 * and this page needs no role check of its own.
 *
 * Nothing shown here is invented: the name, email, role and school are the
 * fields the database actually holds for this account. There is no accountant
 * record beyond it - a finance officer has no class list, no subjects and no
 * separate staff number - so the second card says what the role covers instead
 * of padding the page with fields that do not exist.
 */
export default async function AccountantProfilePage() {
  const { session, fullName, email, schoolName } = await loadShellContext("accountant");

  return (
    <>
      <PageHeader
        title="My profile"
        subtitle="Your account details, and what the finance desk lets you do."
      />

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "2fr 3fr" },
          alignItems: "start",
        }}
      >
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Account
          </Typography>

          <ProfileNameForm currentName={fullName} />

          <TextField
            label="Email address"
            value={email ?? "Not set"}
            fullWidth
            margin="normal"
            slotProps={{
              input: { readOnly: true },
              htmlInput: { "aria-readonly": true },
            }}
            helperText="This is the address you sign in with, so it cannot be changed here. Ask your school administrator to update it."
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Role: {roleLabel[session.role]}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              School: {schoolName}
            </Typography>
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="overline" color="text.secondary">
            Finance desk
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            What this role covers
          </Typography>

          <Box component="ul" sx={{ m: 0, pl: 2.5, display: "grid", gap: 1 }}>
            <Typography component="li" variant="body2">
              Issue each term&apos;s fee assessments, so every pupil in a class is billed from that
              class&apos;s fee structure.
            </Typography>
            <Typography component="li" variant="body2">
              Record the payments that come in and the expenses that go out.
            </Typography>
            <Typography component="li" variant="body2">
              Read the term&apos;s fee status, the payment ledger and what each cost centre has spent.
            </Typography>
          </Box>

          <Typography variant="overline" color="text.secondary" sx={{ display: "block", mt: 3 }}>
            Kept by an administrator
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5, display: "grid", gap: 1 }}>
            <Typography component="li" variant="body2">
              Setting the fee structures - what a class is charged is the school&apos;s fee policy.
            </Typography>
            <Typography component="li" variant="body2">
              Setting the budget the spending is measured against.
            </Typography>
            <Typography component="li" variant="body2">
              Reversing a payment that has already been banked, because that rewrites the audit trail.
            </Typography>
          </Box>

          <Button component={Link} href="/accountant/fees" variant="outlined" sx={{ mt: 3 }}>
            Open the fee overview
          </Button>
        </Paper>
      </Box>
    </>
  );
}
