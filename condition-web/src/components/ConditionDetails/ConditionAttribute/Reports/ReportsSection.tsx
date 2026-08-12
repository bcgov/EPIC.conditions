import React, { memo, useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";
import { ConditionModel } from "@/models/Condition";
import { ReportModel } from "@/models/ConditionAttribute";
import {
  useGetReports,
  useRemoveReport,
} from "@/hooks/api/useReport";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import ReportPhaseAccordion, { PhaseRow } from "./ReportPhaseAccordion";
import { PHASE_ORDER } from "./constants";
import DeleteConfirmationModal from "../ManagementPlan/DeleteConfirmationModal";

type Props = {
  condition: ConditionModel;
  setCondition: React.Dispatch<React.SetStateAction<ConditionModel>>;
};

const ReportsSection = memo(({ condition, setCondition }: Props) => {
  const [deletingReport, setDeletingReport] = useState<ReportModel | null>(null);

  const conditionId = condition.condition_id;

  const { data: reports = [], isLoading, refetch } = useGetReports(conditionId);

  const { mutateAsync: removeReport } = useRemoveReport(conditionId, {
    onSuccess: () => {
      notify.success("Report removed");
      setDeletingReport(null);
    },
    onError: () => notify.error("Failed to remove report"),
  });

  const { mutateAsync: silentRemoveReport } = useRemoveReport(conditionId, {
    onSuccess: () => refetch(),
    onError: () => {},
  });

  // Auto-delete reports that have no submissions left (e.g. after all phases removed).
  // Once all reports are gone, clear requires_report so the parent hides this section.
  useEffect(() => {
    if (isLoading) return;
    const empty = reports.filter((r: ReportModel) => (r.submissions ?? []).length === 0);
    if (empty.length > 0) {
      empty.forEach((r: ReportModel) => silentRemoveReport(r.id));
    } else if (reports.length === 0) {
      setCondition((prev) => ({ ...prev, requires_report: false }));
    }
  }, [reports, isLoading]);

  const confirmDelete = async () => {
    if (deletingReport) await removeReport(deletingReport.id);
  };

  // Group submissions by phase across all reports
  const managementPlans = condition.condition_attributes?.management_plans ?? [];

  const phaseMap: Record<string, PhaseRow[]> = {};
  reports.forEach((report: ReportModel) => {
    const linkedPlan = managementPlans.find(
      (mp) => String(mp.id) === String(report.linked_management_plan_id)
    );
    (report.submissions || []).forEach((sub) => {
      if (!phaseMap[sub.phase]) phaseMap[sub.phase] = [];
      phaseMap[sub.phase].push({
        ...sub,
        reportType: report.report_type,
        reportId: report.id,
        linked_management_plan_id: report.linked_management_plan_id,
        linked_management_plan_name: linkedPlan?.name,
        report_title: report.report_title,
      });
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
            {sortedPhases.map((phase) => (
              <ReportPhaseAccordion
                key={phase}
                phase={phase}
                rows={phaseMap[phase]}
                conditionId={conditionId}
                managementPlans={condition.condition_attributes?.management_plans ?? []}
                onRefetch={refetch}
              />
            ))}

            {sortedPhases.length === 0 && (
              <Typography fontSize="14px" color="text.secondary">
                No reports added yet.
              </Typography>
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
