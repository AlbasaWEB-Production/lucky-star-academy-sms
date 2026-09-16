import Link from "@/components/NextLink";
import { Box, Button, Paper, Typography } from "@mui/material";

import AdmissionForm from "@/components/admin/admissions/AdmissionForm";
import AdmissionLeadRow from "@/components/admin/admissions/AdmissionLeadRow";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { listAdmissions } from "@/lib/data/admissions";
import { listClasses } from "@/lib/data/queries";
import { listTerms } from "@/lib/data/dashboard";

export const metadata = {
  title: "Admissions",
};

/**
 * Records admissions leads and advances their stages.
 *
 * A lead is the school's own record of a prospect (pupil name, guardian, where
 * the enquiry came from, the term they intend to start). It moves through
 * enquiry → application → offer → enrolled, or is declined. Admin-only: RLS on
 * `admissions` grants admins full CRUD and nobody else. The enrolled shape is
 * the same every time — the only per-lead job the admin does here is set the
 * class the pupil joined, which the new-enrolments chart then attributes.
 */
export default async function AdmissionsPage() {
  const [leads, terms, classes] = await Promise.all([
    listAdmissions(),
    listTerms(),
    listClasses(),
  ]);

  const termOptions = terms.map((term) => ({ value: term.id, label: term.name }));
  const classOptions = classes.map((cls) => ({ value: cls.id, label: cls.name }));

  const openLeads = leads.filter((lead) => !["enrolled", "declined"].includes(lead.stage)).length;

  const subtitle =
    leads.length > 0
      ? `${leads.length} lead${leads.length === 1 ? "" : "s"} recorded, ${openLeads} still moving through the funnel.`
      : "No admissions leads yet. Record the first enquiry below, then advance it as the pupil moves through the funnel.";

  return (
    <>
      <PageHeader
        title="Admissions"
        subtitle={subtitle}
        action={
          <Button component={Link} href="/admin/analytics/admissions" variant="outlined">
            View admissions analytics
          </Button>
        }
      />

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Record an enquiry</Typography>
          <Typography variant="caption" color="text.secondary">
            A lead starts at enquiry. Advance it to application, offer and enrolled as the pupil
            progresses — the funnel and new-enrolments chart read from these stages.
          </Typography>
        </Box>
        <AdmissionForm terms={termOptions} />
      </Paper>

      <TableShell
        headers={["Pupil", "Guardian", "Source", "Intake term", "Stage", "Actions"]}
        density="compact"
        isEmpty={leads.length === 0}
        emptyMessage="No admissions leads yet. Record the first enquiry above."
      >
        {leads.map((lead) => (
          <AdmissionLeadRow key={lead.id} lead={lead} classes={classOptions} />
        ))}
      </TableShell>
    </>
  );
}
