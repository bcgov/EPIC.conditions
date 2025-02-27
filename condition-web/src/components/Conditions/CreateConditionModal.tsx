import { FC, useState } from "react";
import {
    Box,
    Button,
    Divider,
    IconButton,
    Modal,
    Paper,
    Stack,
    Typography,
    TextField,
    Autocomplete
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useCreateCondition } from "@/hooks/api/useConditions";
import { useLoadDocumentsByProject } from "@/hooks/api/useDocuments";
import { useLoadConditions } from "@/hooks/api/useConditions";
import { DocumentModel } from "@/models/Document";
import { ConditionModel } from "@/models/Condition";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useNavigate } from "@tanstack/react-router";

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

  const { mutateAsync: createCondition } = useCreateCondition(projectId, documentId, {
    onSuccess: () => notify.success("Condition created successfully"),
    onError: () => notify.error("Failed to create condition"),
  });

  const { data: documentData, isPending: isDocumentsLoading } = useLoadDocumentsByProject(true, projectId);
  const { data: documentConditions, isPending: isConditionsLoading } = useLoadConditions(loadCondition, true, projectId, selectedDocumentId);

  const handleCreateNewCondition = async (conditionDetails?: ConditionModel) => {
    try {
      const response = await createCondition(conditionDetails);
      if (response) {
        navigate({
          to: `/conditions/create/${response.condition_id}`,
        });
      }
    } catch (error) {
      notify.error("Failed to create condition");
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
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
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
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
              </Box>
            )}
            <Typography variant="h6" marginBottom={"15px"}>OR</Typography>
            <Button variant="contained" sx={{ maxWidth: "55%" }} onClick={() => handleCreateNewCondition({})}>
              Add New Manual Condition
            </Button>
          </Stack>
        </Box>
        <Divider />
        <Box sx={{ display: "flex", justifyContent: "right", padding: "14px" }}>
          <Button variant="outlined" sx={{ minWidth: "100px" }} onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            sx={{ marginLeft: "8px", minWidth: "100px" }}
            onClick={() =>
              handleCreateNewCondition(documentConditions?.conditions?.find((condition) => condition.condition_id === selectedConditionId))
            }
          >
            Next
          </Button>
        </Box>
      </Paper>
    </Modal>
  );
};
