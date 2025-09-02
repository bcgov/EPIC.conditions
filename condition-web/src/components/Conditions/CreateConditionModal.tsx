import { FC, useState } from "react";
import {
    Box,
    Button,
    Divider,
    IconButton,
    Modal,
    Paper,
    Stack,
    RadioGroup,
    FormControlLabel,
    Radio,
    Typography,
    TextField,
    Autocomplete
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useCreateCondition } from "@/hooks/api/useConditions";
import { useGetDocumentsByProject } from "@/hooks/api/useDocuments";
import { useGetConditions } from "@/hooks/api/useConditions";
import { DocumentModel } from "@/models/Document";
import { ConditionModel, ConditionType } from "@/models/Condition";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useNavigate } from "@tanstack/react-router";
import { HTTP_STATUS_CODES } from "../../hooks/api/constants";

type ConditionModalProps = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  documentId: string;
};

export const ConditionModal: FC<ConditionModalProps> = ({ open, onClose, projectId, documentId }) => {
  const navigate = useNavigate();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | "">("");
  const [selectedConditionId, setSelectedConditionId] = useState<number | null>(null);
  const [loadCondition, setLoadCondition] = useState(false);

  const [selectedMode, setSelectedMode] = useState<"amend" | "add">("amend");
  const [conditionNumber, setConditionNumber] = useState("");
  const [conditionName, setConditionName] = useState("");
  const [conditionConflictError, setConditionConflictError] = useState(false);

  const { mutateAsync: createCondition } = useCreateCondition(projectId, documentId, selectedMode === "add");

  const { data: documentData, isPending: isDocumentsLoading } = useGetDocumentsByProject(true, projectId);
  const { data: documentConditions, isPending: isConditionsLoading } = useGetConditions(loadCondition, true, projectId, selectedDocumentId);

  const handleCreateNewCondition = async (conditionDetails?: ConditionModel) => {
    try {
      const response = await createCondition(conditionDetails);
      if (response) {
        navigate({
          to: `/conditions/create/${response.condition_id}`,
        });
      }
    }  catch (error) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
      };
  
      if (err.response?.status === HTTP_STATUS_CODES.CONFLICT) {
        setConditionConflictError(true);
      } else {
        notify.error("Failed to create condition");
      }
    }
  }

  const handleClose = () => {
    // reset fields
    setSelectedMode("amend");
    setConditionNumber("");
    setConditionName("");
    setConditionConflictError(false);
    setSelectedDocumentId("");
    setSelectedConditionId(null);
    setLoadCondition(false);
  
    // call parent-provided close
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Paper sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "90%",
        maxWidth: "500px",
        borderRadius: "4px",
        outline: "none",
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" padding={"14px 5px 14px 14px"}>
          <Typography variant="h6">Manual Condition Entry</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        {/* Mode Selection */}
        <Box padding={"14px"}>
          <Typography
            variant="body1"
            gutterBottom
            sx={{
              fontSize: '1rem',
              fontWeight: 400,
              lineHeight: 1.5,
              color: 'text.primary',
            }}
          >
            Please select an option below:
          </Typography>
          <RadioGroup
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value as "amend" | "add")}
          >
            <FormControlLabel value="amend" control={<Radio />} label="Amend Existing Condition" />
            <FormControlLabel value="add" control={<Radio />} label="Add New Condition" />
          </RadioGroup>
        </Box>

        {selectedMode === "amend" && (
          <Box display="flex" justifyContent="space-between" alignItems="center" padding={"14px"}>
            <Stack direction={"column"} sx={{ width: "100%" }}>
              <Typography variant="body1" marginBottom={"2px"}>Select from Existing Document</Typography>
              <Autocomplete
                id="condition-selector"
                options={(documentData || []) as DocumentModel[]}
                renderInput={(params) => (
                  <TextField {...params} label=" " InputLabelProps={{ shrink: false }} fullWidth />
                )}
                getOptionLabel={(document: DocumentModel) => document.document_label}
                onChange={(_e, document: DocumentModel | null) => {
                  setSelectedDocumentId(document?.document_id || "");
                  setLoadCondition(true);
                }}
                disabled={isDocumentsLoading}
                size="small"
              />
              {selectedDocumentId && !isConditionsLoading && (
                <>
                  <Typography variant="body1" marginBottom={"2px"}>Condition</Typography>
                  <Autocomplete
                    id="condition-selector"
                    options={documentConditions?.conditions || []}
                    renderInput={(params) => (
                      <TextField {...params} label=" " InputLabelProps={{ shrink: false }} fullWidth />
                    )}
                    getOptionLabel={(condition: ConditionModel) => `${condition.condition_number || "No Number"} - ${condition.condition_name || "Unknown Condition"}`}
                    onChange={(_e, condition: ConditionModel | null) => {
                      setSelectedConditionId(condition?.condition_id || null);
                    }}
                    disabled={isConditionsLoading}
                    size="small"
                  />
                </>
              )}
              {selectedConditionId && documentConditions?.conditions?.find(condition => condition.condition_id === selectedConditionId) && (
                <Box sx={{ marginTop: 0 }}>
                  <Typography variant="body1" marginBottom={"2px"}>Condition Preview</Typography>
                  <TextField
                    value={documentConditions.conditions
                      .find(condition => condition.condition_id === selectedConditionId)
                      ?.subconditions?.map(subcondition => subcondition.subcondition_text).join(' ') || ""}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                  />
              {conditionConflictError && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    marginBottom: "15px",
                    color: "#CE3E39",
                    marginTop: "-20px",
                  }}
                >
                  This condition number already exists within this amendment.
                </Box>
              ) }
                </Box>
              )}
            </Stack>
          </Box>
        )}

        {selectedMode === "add" && (
          <Box display="flex" justifyContent="space-between" alignItems="center" padding={"14px 5px 14px 14px"}>
            <Stack direction={"column"} spacing={.1} sx={{ width: "100%" }}>
              <Box>
                <Typography variant="body1" marginBottom={"8px"}>
                  Please enter the condition number and name below.
                </Typography>
              </Box>

              <Stack direction={"row"} sx={{ width: "100%" }}>
                <Box sx={{ width: "35%" }}>
                  <TextField
                    label="Condition Number"
                    value={conditionNumber}
                    onChange={(e) => {
                      setConditionNumber(e.target.value);
                      if (conditionConflictError) {
                        setConditionConflictError(false);
                      }
                    }}
                    fullWidth
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                      sx: {
                        fontSize: '1rem !important',
                        fontWeight: 400,
                        lineHeight: 1.5,
                        color: 'text.primary',
                        textTransform: 'none',
                        letterSpacing: 'normal',
                        transform: 'none !important',
                        top: '0 !important',
                        "&.Mui-focused": {
                          color: 'text.primary',
                        },
                        "&.MuiInputLabel-shrink": {
                          transform: 'none !important',
                          top: '0 !important',
                        },
                      }
                    }}
                  />
                </Box>
                <Box sx={{ width: "60%", paddingLeft: "15px" }}>
                  <TextField
                    label="Condition Name"
                    value={conditionName}
                    onChange={(e) => setConditionName(e.target.value)}
                    fullWidth
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                      sx: {
                        fontSize: '1rem !important',
                        fontWeight: 400,
                        lineHeight: 1.5,
                        color: 'text.primary',
                        textTransform: 'none',
                        letterSpacing: 'normal',
                        transform: 'none !important',
                        top: '0 !important',
                        "&.Mui-focused": {
                          color: 'text.primary',
                        },
                        "&.MuiInputLabel-shrink": {
                          transform: 'none !important',
                          top: '0 !important',
                        },
                      }
                    }}
                  />
                </Box>
              </Stack>
              {conditionConflictError ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    marginBottom: "15px",
                    color: "#CE3E39",
                    marginTop: "-20px",
                  }}
                >
                  This condition number already exists. Please enter a new one.
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    marginBottom: "15px",
                    color: "#CE3E39",
                    marginTop: "-20px",
                  }}
                >
                  Adding this condition will NOT amend any existing condition. Do you wish to proceed?
                </Box>
              )}
            </Stack>
          </Box>
        )}

        <Divider />
        <Box sx={{ display: "flex", justifyContent: "right", padding: "14px" }}>
          <Button variant="outlined" sx={{ minWidth: "100px" }} onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            sx={{ marginLeft: "8px", minWidth: "100px" }}
            onClick={() => {
              if (selectedMode === "add") {
                handleCreateNewCondition({
                  condition_number: Number(conditionNumber) || undefined,
                  condition_name: conditionName,
                  condition_type: ConditionType.ADD
                });
              } else {
                const selectedCondition = documentConditions?.conditions?.find(
                  (condition) => condition.condition_id === selectedConditionId
                );
                if (selectedCondition) {
                  handleCreateNewCondition({
                    ...selectedCondition,
                    condition_type: ConditionType.AMEND,
                  });
                }
              }
            }}
          >
            Next
          </Button>
        </Box>
      </Paper>
    </Modal>
  );
};
