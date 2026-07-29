import React, { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import AddIcon from "@mui/icons-material/Add";
import { ReportSubmissionModel } from "@/models/ConditionAttribute";
import DeleteConfirmationModal from "../ManagementPlan/DeleteConfirmationModal";
import {
  useAddReportSubmission,
  usePatchReportSubmission,
  useRemoveReportSubmission,
} from "@/hooks/api/useReport";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { PSN_FREQUENCIES, PSN_SUBMISSION_TYPES, REPORT_FREQUENCIES } from "./constants";
import { useHasAllowedRoles, KeycloakRoles } from "@/hooks/useAuthorization";
import { BCDesignTokens } from "epic.theme";

const PSN_TYPE = "Project Status Notification";
const TIMING_PLACEHOLDER = "e.g. within 30 days after the issuance of this Certificate.";

export type PhaseRow = ReportSubmissionModel & { reportType: string; reportId: number };

type EditValues = {
  frequency: string;
  timing: string;
  condition_subsection: string;
  report_submission_type: string;
};

const toEditValues = (row: PhaseRow): EditValues => ({
  frequency: row.frequency ?? "",
  timing: row.timing ?? "",
  condition_subsection: row.condition_subsection ?? "",
  report_submission_type: row.report_submission_type ?? "",
});

const FrequencyChip = ({ value }: { value: string }) => (
  <Chip
    label={value || "—"}
    size="small"
    variant="outlined"
    sx={{
      fontSize: "11px",
      height: 22,
      borderRadius: "100px",
      borderColor: "#aaa",
      color: "#444",
    }}
  />
);

const SubsectionTypeBadge = ({ subsection, type }: { subsection?: string; type?: string }) => (
  <Box display="flex" alignItems="center" gap={0.75}>
    {subsection && (
      <Box
        sx={{
          background: "#e8e8e8",
          borderRadius: "4px",
          px: 0.75,
          py: 0.25,
          fontSize: "11px",
          fontWeight: 600,
          color: "#444",
          whiteSpace: "nowrap",
        }}
      >
        {subsection}
      </Box>
    )}
    <Typography fontSize="13px">{type || "—"}</Typography>
  </Box>
);

type Props = {
  phase: string;
  rows: PhaseRow[];
  conditionId?: number;
  onRefetch: () => void;
};

const ReportPhaseAccordion: React.FC<Props> = ({ phase, rows, conditionId, onRefetch }) => {
  const canManage = useHasAllowedRoles([KeycloakRoles.MANAGE_CONDITIONS]);
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editMap, setEditMap] = useState<Record<number, EditValues>>({});
  const [newSubs, setNewSubs] = useState<Record<string, EditValues | null>>({});
  const [confirmRemoveType, setConfirmRemoveType] = useState<string | null>(null);
  const [confirmRemovePhase, setConfirmRemovePhase] = useState(false);

  const allApproved = rows.length > 0 && rows.every((r) => r.is_approved);
  const isPSN = rows.some((r) => r.reportType === PSN_TYPE);
  const frequencies = isPSN ? PSN_FREQUENCIES : REPORT_FREQUENCIES;

  const { mutateAsync: patchSubmission, isPending: saving } = usePatchReportSubmission(conditionId);
  const { mutateAsync: removeSubmission } = useRemoveReportSubmission(conditionId);
  const { mutateAsync: addSubmission } = useAddReportSubmission(conditionId);

  const enterEdit = () => {
    const map: Record<number, EditValues> = {};
    rows.forEach((r) => { map[r.id] = toEditValues(r); });
    setEditMap(map);
    setNewSubs({});
    setEditMode(true);
    setExpanded(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditMap({});
    setNewSubs({});
  };

  const saveAll = async () => {
    try {
      await Promise.all(
        rows.map((row) => patchSubmission({ submissionId: row.id, payload: editMap[row.id] }))
      );
      await Promise.all(
        Object.entries(newSubs).map(([reportType, newSub]) => {
          if (!newSub) return Promise.resolve();
          const reportId = byType[reportType]?.[0]?.reportId;
          if (!reportId) return Promise.resolve();
          return addSubmission({ reportId, payload: { phases: [phase], ...newSub } });
        })
      );
      setEditMode(false);
      setEditMap({});
      setNewSubs({});
      onRefetch();
      notify.success("Changes saved");
    } catch {
      notify.error("Failed to save changes");
    }
  };

  const handleDeleteRow = async (submissionId: number) => {
    try {
      await removeSubmission(submissionId);
      onRefetch();
      notify.success("Submission removed");
    } catch {
      notify.error("Failed to remove submission");
    }
  };

  const handleDeletePhase = async () => {
    try {
      await Promise.all(rows.map((r) => removeSubmission(r.id)));
      onRefetch();
      setConfirmRemovePhase(false);
      notify.success("Phase removed");
    } catch {
      notify.error("Failed to remove phase");
    }
  };

  const handleApprove = async () => {
    const next = !allApproved;
    try {
      await Promise.all(
        rows.map((r) => patchSubmission({ submissionId: r.id, payload: { is_approved: next } }))
      );
      onRefetch();
      notify.success(next ? "Phase approved" : "Approval removed");
    } catch {
      notify.error("Failed to update approval");
    }
  };

  const setEdit = (id: number, key: keyof EditValues, value: string) =>
    setEditMap((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));

  const setNewField = (reportType: string, key: keyof EditValues, value: string) =>
    setNewSubs((prev) => ({
      ...prev,
      [reportType]: {
        ...(prev[reportType] ?? { frequency: "", timing: "", condition_subsection: "", report_submission_type: "" }),
        [key]: value,
      },
    }));

  const handleDeleteReportType = async (reportType: string) => {
    const rowsToDelete = byType[reportType] || [];
    try {
      await Promise.all(rowsToDelete.map((r) => removeSubmission(r.id)));
      onRefetch();
      setConfirmRemoveType(null);
      notify.success(`${reportType} removed`);
    } catch {
      notify.error("Failed to remove report type");
    }
  };

  // Group rows by reportType for display
  const byType: Record<string, PhaseRow[]> = {};
  rows.forEach((r) => {
    if (!byType[r.reportType]) byType[r.reportType] = [];
    byType[r.reportType].push(r);
  });

  const statusChip = (
    <Chip
      label={allApproved ? "Confirmed" : "Awaiting Approval"}
      size="small"
      sx={{
        backgroundColor: allApproved ? "#d5f0dd" : "#fef3cd",
        color: allApproved ? "#1a6431" : "#7a5a00",
        fontWeight: 600,
        fontSize: "11px",
        borderRadius: "4px",
        height: 22,
      }}
    />
  );

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, v) => { if (!editMode) setExpanded(v); }}
      disableGutters
      sx={{
        mb: 1,
        border: "1px solid #d8d8d8",
        borderRadius: "4px !important",
        "&:before": { display: "none" },
        boxShadow: "none",
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ px: 2, minHeight: 48, "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1 } }}
      >
        {/* Left: phase name + count + status */}
        <Typography fontWeight={600} fontSize="14px">{phase}</Typography>
        <Chip
          label={rows.length}
          size="small"
          sx={{ backgroundColor: "#e8e8e8", color: "#555", fontSize: "11px", height: 20, borderRadius: "100px" }}
        />
        {statusChip}

        {/* Right: trash (stop propagation so it doesn't toggle accordion) */}
        <Box flex={1} />
        {canManage && (
          <Tooltip title="Remove phase">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); setConfirmRemovePhase(true); }}
              sx={{ color: "#888", mr: 0.5 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0 }}>
        {/* Submission Requirements header row */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1, borderTop: "1px solid #e8e8e8" }}
        >
          <Typography fontSize="13px" color="text.secondary">
            Submission Requirements
          </Typography>
          {canManage && (
            editMode ? (
              <Box display="flex" gap={2} alignItems="center">
                <Button
                  size="small"
                  disableRipple
                  startIcon={<SaveAltIcon sx={{ fontSize: "16px !important", color: BCDesignTokens.typographyColorLink }} />}
                  onClick={saveAll}
                  disabled={saving}
                  sx={{
                    fontSize: "14px",
                    fontWeight: 700,
                    textTransform: "none",
                    color: BCDesignTokens.typographyColorLink,
                    p: 0,
                    minWidth: 0,
                    background: "transparent",
                    "& .MuiButton-startIcon": { marginRight: "4px" },
                    "&:hover": { background: "transparent", textDecoration: "underline" },
                    "&:active": { background: "transparent" },
                    "&:focus": { background: "transparent" },
                  }}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="small"
                  disableRipple
                  onClick={cancelEdit}
                  sx={{
                    fontSize: "14px",
                    fontWeight: 700,
                    textTransform: "none",
                    color: "#6d7274",
                    p: 0,
                    minWidth: 0,
                    background: "transparent",
                    "&:hover": { background: "transparent", textDecoration: "underline" },
                    "&:active": { background: "transparent" },
                    "&:focus": { background: "transparent" },
                  }}
                >
                  Cancel
                </Button>
              </Box>
            ) : (
              <Button
                size="small"
                disableRipple
                startIcon={<EditIcon sx={{ fontSize: "16px !important", color: BCDesignTokens.typographyColorLink }} />}
                onClick={enterEdit}
                sx={{
                  fontSize: "14px",
                  fontWeight: 700,
                  textTransform: "none",
                  color: BCDesignTokens.typographyColorLink,
                  p: 0,
                  minWidth: 0,
                  background: "transparent",
                  "& .MuiButton-startIcon": { marginRight: "4px" },
                  "&:hover": { background: "transparent", textDecoration: "underline" },
                  "&:active": { background: "transparent" },
                  "&:focus": { background: "transparent" },
                }}
              >
                Edit
              </Button>
            )
          )}
        </Box>

        {/* Per-report-type table */}
        {Object.entries(byType).map(([reportType, typeRows]) => (
          <TableContainer key={reportType} sx={{ mb: 1 }}>
            <Table size="small" sx={{ "& td": { verticalAlign: "middle" } }}>
              <TableHead>
                {/* Report type gray header */}
                <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                  <TableCell
                    colSpan={3}
                    sx={{ fontWeight: 700, fontSize: "13px", py: 0.75, color: "#333" }}
                  >
                    {reportType}
                  </TableCell>
                  <TableCell sx={{ py: 0.75, textAlign: "right" }}>
                    {canManage && (
                      <Button
                        size="small"
                        disableRipple
                        onClick={() => setConfirmRemoveType(reportType)}
                        sx={{
                          fontSize: "12px",
                          fontWeight: 400,
                          fontFamily: '"BC Sans"',
                          lineHeight: "18px",
                          textAlign: "center",
                          textTransform: "none",
                          color: "#D32F2F",
                          p: 0,
                          minWidth: 0,
                          background: "transparent",
                          "&:hover": { background: "transparent", textDecoration: "underline" },
                          "&:active": { background: "transparent" },
                          "&:focus": { background: "transparent" },
                        }}
                      >
                        Remove Report
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                {/* Column headers */}
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: "11px", color: "#666", textTransform: "uppercase", py: 0.5 }}>
                    Frequency
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "11px", color: "#666", textTransform: "uppercase", py: 0.5 }}>
                    Type
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "11px", color: "#666", textTransform: "uppercase", py: 0.5 }}>
                    Timing
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {typeRows.map((row) => {
                  const ev = editMap[row.id];
                  return (
                    <TableRow key={row.id} hover>
                      {/* Frequency */}
                      <TableCell sx={{ py: 1, verticalAlign: "middle" }}>
                        {editMode ? (
                          <Select
                            value={ev?.frequency ?? ""}
                            onChange={(e) => setEdit(row.id, "frequency", e.target.value)}
                            size="small"
                            sx={{ minWidth: 140 }}
                          >
                            {frequencies.map((f) => (
                              <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                            ))}
                          </Select>
                        ) : (
                          <FrequencyChip value={row.frequency} />
                        )}
                      </TableCell>

                      {/* Type (subsection badge + type name) */}
                      <TableCell sx={{ py: 1, verticalAlign: "middle" }}>
                        {editMode ? (
                          <Box display="flex" gap={1} flexDirection="column">
                            <TextField
                              value={ev?.condition_subsection ?? ""}
                              onChange={(e) => setEdit(row.id, "condition_subsection", e.target.value)}
                              size="small"
                              placeholder="e.g. 4.1"
                              sx={{ width: 90 }}
                            />
                            {isPSN && (
                              <Select
                                value={ev?.report_submission_type ?? ""}
                                onChange={(e) => setEdit(row.id, "report_submission_type", e.target.value)}
                                size="small"
                                sx={{ minWidth: 200 }}
                              >
                                <MenuItem value=""><em>Select...</em></MenuItem>
                                {PSN_SUBMISSION_TYPES.map((t) => (
                                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                                ))}
                              </Select>
                            )}
                          </Box>
                        ) : (
                          <SubsectionTypeBadge
                            subsection={row.condition_subsection}
                            type={row.report_submission_type || (isPSN ? undefined : reportType)}
                          />
                        )}
                      </TableCell>

                      {/* Timing */}
                      <TableCell sx={{ py: 1, verticalAlign: "middle" }}>
                        {editMode ? (
                          <TextField
                            value={ev?.timing ?? ""}
                            onChange={(e) => setEdit(row.id, "timing", e.target.value)}
                            size="small"
                            placeholder={TIMING_PLACEHOLDER}
                            multiline
                            minRows={1}
                            sx={{ minWidth: 220 }}
                          />
                        ) : (
                          <Typography fontSize="13px">{row.timing || "—"}</Typography>
                        )}
                      </TableCell>

                      {/* Remove row (edit mode only, when multiple rows) */}
                      <TableCell sx={{ py: 1, verticalAlign: "middle" }}>
                        {editMode && typeRows.length > 1 && (
                          <Button
                            size="small"
                            disableRipple
                            onClick={() => handleDeleteRow(row.id)}
                            sx={{
                              fontSize: "12px",
                              fontWeight: 400,
                              fontFamily: '"BC Sans"',
                              lineHeight: "18px",
                              textAlign: "center",
                              textTransform: "none",
                              color: "#D32F2F",
                              p: 0,
                              minWidth: 0,
                              background: "transparent",
                              "&:hover": { background: "transparent", textDecoration: "underline" },
                              "&:active": { background: "transparent" },
                              "&:focus": { background: "transparent" },
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* New submission row per report type */}
                {editMode && newSubs[reportType] !== null && newSubs[reportType] !== undefined && (
                  <TableRow>
                    <TableCell sx={{ py: 1, verticalAlign: "middle" }}>
                      <Select
                        value={newSubs[reportType]!.frequency}
                        onChange={(e) => setNewField(reportType, "frequency", e.target.value)}
                        size="small"
                        sx={{ minWidth: 140 }}
                        displayEmpty
                      >
                        <MenuItem value="" disabled><em>Frequency</em></MenuItem>
                        {frequencies.map((f) => (
                          <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell sx={{ py: 1, verticalAlign: "middle" }}>
                      <Box display="flex" gap={1} flexDirection="column">
                        <TextField
                          value={newSubs[reportType]!.condition_subsection}
                          onChange={(e) => setNewField(reportType, "condition_subsection", e.target.value)}
                          size="small"
                          placeholder="e.g. 4.1"
                          sx={{ width: 90 }}
                        />
                        {isPSN && (
                          <Select
                            value={newSubs[reportType]!.report_submission_type}
                            onChange={(e) => setNewField(reportType, "report_submission_type", e.target.value)}
                            size="small"
                            sx={{ minWidth: 200 }}
                          >
                            <MenuItem value=""><em>Select type...</em></MenuItem>
                            {PSN_SUBMISSION_TYPES.map((t) => (
                              <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                            ))}
                          </Select>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1, verticalAlign: "middle" }}>
                      <TextField
                        value={newSubs[reportType]!.timing}
                        onChange={(e) => setNewField(reportType, "timing", e.target.value)}
                        size="small"
                        placeholder={TIMING_PLACEHOLDER}
                        multiline
                        minRows={1}
                        sx={{ minWidth: 220 }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1, verticalAlign: "middle" }}>
                      <Button
                        size="small"
                        disableRipple
                        onClick={() => setNewSubs((prev) => ({ ...prev, [reportType]: null }))}
                        sx={{
                          fontSize: "12px",
                          fontWeight: 400,
                          fontFamily: '"BC Sans"',
                          lineHeight: "18px",
                          textAlign: "center",
                          textTransform: "none",
                          color: "#D32F2F",
                          p: 0,
                          minWidth: 0,
                          background: "transparent",
                          "&:hover": { background: "transparent", textDecoration: "underline" },
                          "&:active": { background: "transparent" },
                          "&:focus": { background: "transparent" },
                        }}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {editMode && (
              <Box px={2} pb={1} pt={0.5}>
                <Button
                  size="small"
                  disableRipple
                  onClick={() => setNewSubs((prev) => ({
                    ...prev,
                    [reportType]: { frequency: "", timing: "", condition_subsection: "", report_submission_type: "" },
                  }))}
                  disabled={newSubs[reportType] !== null && newSubs[reportType] !== undefined}
                  startIcon={<AddIcon sx={{ fontSize: "13px !important", color: BCDesignTokens.typographyColorLink }} />}
                  sx={{
                    fontSize: "13px",
                    fontWeight: 400,
                    textTransform: "none",
                    color: BCDesignTokens.typographyColorLink,
                    p: 0,
                    minWidth: 0,
                    background: "transparent",
                    "& .MuiButton-startIcon": { marginRight: "4px" },
                    "&:hover": { background: "transparent", textDecoration: "underline" },
                    "&:active": { background: "transparent" },
                    "&:focus": { background: "transparent" },
                  }}
                >
                  Add Submission Requirement
                </Button>
              </Box>
            )}
        </TableContainer>
        ))}

        {/* Approve Report button (hidden in edit mode) */}
        {!editMode && canManage && (
          <Box display="flex" justifyContent="flex-end" px={2} pb={2} pt={1}>
            <Button
              variant="contained"
              size="small"
              onClick={handleApprove}
              sx={{ textTransform: "none", backgroundColor: allApproved ? "#555" : undefined }}
            >
              {allApproved ? "Un-approve Report" : "Approve Report"}
            </Button>
          </Box>
        )}
      </AccordionDetails>

      <DeleteConfirmationModal
        open={!!confirmRemoveType}
        title="Remove Report"
        description={`By removing <strong>${confirmRemoveType}</strong>, you will lose all of its submission requirements for this phase.<br/><br/>Are you sure you wish to proceed?`}
        onClose={() => setConfirmRemoveType(null)}
        onConfirm={() => confirmRemoveType && handleDeleteReportType(confirmRemoveType)}
      />

      <DeleteConfirmationModal
        open={confirmRemovePhase}
        title="Remove Phase"
        description={`By removing the <strong>${phase}</strong> phase, you will lose all of its submission requirements.<br/><br/>Are you sure you wish to proceed?`}
        onClose={() => setConfirmRemovePhase(false)}
        onConfirm={handleDeletePhase}
      />
    </Accordion>
  );
};

export default ReportPhaseAccordion;
