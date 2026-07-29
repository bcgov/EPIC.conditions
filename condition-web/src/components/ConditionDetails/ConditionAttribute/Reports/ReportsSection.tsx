import React, { memo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { ConditionModel } from "@/models/Condition";
import { ReportModel } from "@/models/ConditionAttribute";
import {
  useGetReports,
  useCreateReport,
  useRemoveReport,
} from "@/hooks/api/useReport";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useHasAllowedRoles, KeycloakRoles } from "@/hooks/useAuthorization";
import AddReportForm, { ReportFormValues } from "./AddReportForm";
import ReportPhaseAccordion, { PhaseRow } from "./ReportPhaseAccordion";
import { PHASE_ORDER } from "./constants";
import DeleteConfirmationModal from "../ManagementPlan/DeleteConfirmationModal";

type Props = {
  condition: ConditionModel;
  setCondition: React.Dispatch<React.SetStateAction<ConditionModel>>;
};

const ReportsSection = memo(({ condition, setCondition: _setCondition }: Props) => {
  const canManage = useHasAllowedRoles([KeycloakRoles.MANAGE_CONDITIONS]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingReport, setDeletingReport] = useState<ReportModel | null>(null);

  const conditionId = condition.condition_id;

  const { data: reports = [], isLoading, refetch } = useGetReports(conditionId);

  const { mutateAsync: createReport, isPending: creating } = useCreateReport(conditionId, {
    onSuccess: () => notify.success("Report added successfully"),
    onError: () => notify.error("Failed to add report"),
  });

  const { mutateAsync: removeReport, isPending: deleting } = useRemoveReport(conditionId, {
    onSuccess: () => {
      notify.success("Report removed");
      setDeletingReport(null);
    },
    onError: () => notify.error("Failed to remove report"),
  });

  const handleSave = async (values: ReportFormValues) => {
    await createReport(values as never);
    setShowAddForm(false);
  };

  const confirmDelete = async () => {
    if (deletingReport) await removeReport(deletingReport.id);
  };

  // Group submissions by phase across all reports
  const phaseMap: Record<string, PhaseRow[]> = {};
  reports.forEach((report: ReportModel) => {
    (report.submissions || []).forEach((sub) => {
      if (!phaseMap[sub.phase]) phaseMap[sub.phase] = [];
      phaseMap[sub.phase].push({ ...sub, reportType: report.report_type, reportId: report.id });
    });
  });

  const sortedPhases = [
    ...PHASE_ORDER.filter((p) => phaseMap[p]),
    ...Object.keys(phaseMap).filter((p) => !PHASE_ORDER.includes(p)).sort(),
  ];

  return (
    <Box sx={{ mb: 2 }}>
      {/* Section header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          ml: "28px",
          py: 1,
          backgroundColor: "#f1f8fe",
          borderRadius: "2px 2px 0 0",
        }}
      >
        <Typography fontSize="18px" color="#2d2d2d" ml="15px">
          Reports
        </Typography>
        <Box
          sx={{
            height: 22,
            borderRadius: "100px",
            backgroundColor: "#d8d8d8",
            color: "#474543",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            px: 1,
          }}
        >
          {reports.length}
        </Box>
      </Box>

      <Box sx={{ px: "28px", py: 2 }}>
        {isLoading ? (
          <CircularProgress size={24} />
        ) : (
          <>
            {/* Phase accordions */}
            {sortedPhases.map((phase) => (
              <ReportPhaseAccordion
                key={phase}
                phase={phase}
                rows={phaseMap[phase]}
                conditionId={conditionId}
                onRefetch={refetch}
              />
            ))}

            {reports.length === 0 && !showAddForm && (
              <Typography fontSize="14px" color="text.secondary">
                No reports added yet.
              </Typography>
            )}

            {/* Add Report Form */}
            {showAddForm ? (
              <>
                <Divider sx={{ my: 2 }} />
                <AddReportForm
                  managementPlans={condition.condition_attributes?.management_plans ?? []}
                  onSave={handleSave}
                  onCancel={() => setShowAddForm(false)}
                  saving={creating}
                />
              </>
            ) : (
              canManage && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddForm(true)}
                  sx={{ mt: reports.length > 0 ? 2 : 0 }}
                >
                  Add Report
                </Button>
              )
            )}
          </>
        )}
      </Box>

      <DeleteConfirmationModal
        open={!!deletingReport}
        title="Remove Report"
        description={`By removing this Report, you will lose all of its associated submission requirements.<br/><br/>Are you sure you wish to proceed?`}
        onClose={() => setDeletingReport(null)}
        onConfirm={confirmDelete}
      />
    </Box>
  );
});

export default ReportsSection;
