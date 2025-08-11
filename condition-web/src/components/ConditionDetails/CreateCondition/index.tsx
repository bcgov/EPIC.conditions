import { useEffect, useState } from "react";
import { BCDesignTokens } from "epic.theme";
import { ConditionModel, createDefaultCondition, ProjectDocumentConditionDetailModel } from "@/models/Condition";
import {
  Box,
  Button,
  IconButton,
  Grid,
  Stack,
  TextField,
  Typography,
  Modal,
  Paper,
  Divider,
  DialogActions
} from "@mui/material";
import { styled } from "@mui/system";
import { StyledTableHeadCell } from "../../Shared/Table/common";
import CreateConditionInfoTabs from "./CreateConditionInfoTabs";
import { useRemoveCondition, useUpdateCondition } from "@/hooks/api/useConditions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import ChipInput from "../../Shared/Chips/ChipInput";
import { useNavigate } from "@tanstack/react-router";
import CloseIcon from '@mui/icons-material/Close';
import LoadingButton from "../../Shared/Buttons/LoadingButton";

export const CardInnerBox = styled(Box)({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  flexDirection: "column",
  height: "100%",
  padding: "0 12px",
});

type ConditionsParam = {
  conditionData?: ProjectDocumentConditionDetailModel;
};

export const CreateConditionPage = ({
  conditionData
}: ConditionsParam) => {

  const navigate = useNavigate();

  const [condition, setCondition] = useState<ConditionModel>(
    conditionData?.condition || createDefaultCondition);

  const [tags, setTags] = useState<string[]>(condition?.topic_tags ?? []);
  const [conditionNumberError, setConditionNumberError] = useState(false);
  const [conditionNameError, setConditionNameError] = useState(false);
  const [conditionConflictError, setConditionConflictError] = useState(false);
  const [preconditionFailedError, setPreconditionFailedError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allowDuplicateCondition, setAllowDuplicateCondition] = useState(false);

  const handleInputChange = (key: keyof ConditionModel) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const updatedValue = event.target.value;
    setConditionNumberError(false);
    setConditionNameError(false);
    setConditionConflictError(false);
    setPreconditionFailedError(false);
    setCondition((prevCondition) => ({
      ...prevCondition,
      [key]: updatedValue,
      }));
    };
  
  useEffect(() => {
    setCondition((prevCondition) => ({
        ...prevCondition,
        topic_tags: tags,
      }));
  }, [tags, setTags]);

  const { mutateAsync: updateCondition } = useUpdateCondition(
    allowDuplicateCondition,
    condition?.condition_id,
  );

  const onRemoveFailure = () => {
    notify.error("Failed to remove condition");
  };

  const onRemoveSuccess = () => {
    notify.success("Condition removed successfully");
  };

  const { mutateAsync: removeCondition } = useRemoveCondition(
    condition?.condition_id,
    {
      onSuccess: onRemoveSuccess,
      onError: onRemoveFailure,
    }
  );

  const handleSaveAndClose = async () => {
    setAllowDuplicateCondition(true);
    setLoading(true);
    let errorFlag = false;

    if (!condition) {
      notify.error("Condition data is incomplete or undefined.");
      errorFlag = true;
    }

    if (!condition?.condition_number) {
      setConditionNumberError(true);
      errorFlag = true;
    }

    if (!condition?.condition_name) {
      setConditionNameError(true);
      errorFlag = true;
    }

    if (errorFlag) {
      notify.error("Failed to save condition.");
      setAllowDuplicateCondition(false);
      return;
    }

    try {
      const data: ConditionModel = {
        ...condition,
      };
      const response = await updateCondition(data);
      if (response) {
        navigate({
          to: `/conditions/project/${conditionData?.project_id}/document/${conditionData?.document_id}`,
        });
      }
    } catch (error) {
      const responseError = error as {
        response?: {
          data?: {
            message?: string;
            is_amendment?: boolean;
          };
          status?: number;
        };
      };
      if (responseError.response?.status === 409) {
        setConditionConflictError(true);
      } else if (responseError.response?.status === 412) {
        setPreconditionFailedError(true);
        setErrorMessage(responseError.response.data?.message || ""); // Set error message
        setModalTitle(responseError.response?.data?.is_amendment
          ? "Amending Existing Condition"
          : "Duplicate Condition Number")
        setModalOpen(true); // Open the modal
      } else if (responseError.response?.status) {
        notify.error("Failed to save condition."); // Only for unhandled status codes
      } else {
        notify.error("An unexpected error occurred."); // Handle unexpected structures
      }
    } finally {
      setLoading(false); // Stop loading once the request is complete
    }

    setAllowDuplicateCondition(false)
  }

  const handleRemove = async () => {
    try {
      const response = await removeCondition();
      if (response) {
        navigate({
          to: `/conditions/project/${conditionData?.project_id}/document/${conditionData?.document_id}`,
        });
      }
    } catch (error) {
      notify.error("Failed to remove condition.");
    }
  }

  const handleModalClose = () => {
    setModalOpen(false); // Close the modal
    setPreconditionFailedError(false); // Reset the error state
  };

  return (
    <>
      <Grid container sx={{ border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`, borderRadius: 1 }}>
        <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'row', flexGrow: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '50%', height: '100%', paddingRight: '5em'}}>
            <Grid container direction="row">
              <Grid item xs={8}>
                <Stack direction="row" alignItems="flex-start" spacing={-2}>
                  <StyledTableHeadCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                      Project:
                  </StyledTableHeadCell>
                  <StyledTableHeadCell sx={{ verticalAlign: "top" }}>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {conditionData?.project_name}
                      </Typography>
                  </StyledTableHeadCell>
                </Stack>
              </Grid>
              <Grid item xs={4}>
                <Stack direction="row" alignItems="flex-start" spacing={-2}>
                    <StyledTableHeadCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                        Year Condition Issued:
                    </StyledTableHeadCell>
                    <StyledTableHeadCell sx={{ verticalAlign: "top" }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                            {condition?.year_issued}
                        </Typography>
                    </StyledTableHeadCell>
                </Stack>
              </Grid>
            </Grid>
            <Grid container direction="row" marginBottom={2} marginTop={-2}>
              <Grid container direction="row" alignItems="center">
                  <Grid item xs={8} sx={{ height: "60px" }}>
                      <Stack direction="row" alignItems="flex-start" spacing={-2}>
                          <StyledTableHeadCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                              Source:
                          </StyledTableHeadCell>
                          <StyledTableHeadCell sx={{ verticalAlign: "top" }}>
                              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                  {conditionData?.document_label}
                              </Typography>
                          </StyledTableHeadCell>
                      </Stack>
                  </Grid>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', width: '50%', height: '100%' }}>
            <Grid container direction="row">
              <Stack direction="row" alignItems="flex-start" spacing={-2}>
                <StyledTableHeadCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                  Tags:
                </StyledTableHeadCell>
                <StyledTableHeadCell sx={{ verticalAlign: "top" }}>
                  <ChipInput
                    chips={tags}
                    setChips={setTags}
                    placeholder="Add tag"
                    inputWidth="100%"
                  />
                </StyledTableHeadCell>
              </Stack>
            </Grid>
          </Box>
        </Grid>

        <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'row'}}>
          <Grid item xs={1.25} sx={{ flexGrow: 0 }}>
            <StyledTableHeadCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
              Condition Number
            </StyledTableHeadCell>
            <Box sx={{ paddingLeft: "15px" }}>
              <TextField
                variant="outlined"
                size="small"
                sx={{ width: '90%' }}
                value={condition?.condition_number}
                onChange={handleInputChange('condition_number')}
                error={conditionNumberError}
                helperText={conditionNumberError ? "Please enter a Condition Number" : ""}
              />
            </Box>
          </Grid>

          <Grid item xs={3} sx={{ flexGrow: 0 }}>
            <StyledTableHeadCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
              Condition Name
            </StyledTableHeadCell>
            <Box sx={{ paddingLeft: "15px" }}>
              <TextField
                variant="outlined"
                size="small"
                sx={{ width: '200%' }}
                value={condition?.condition_name}
                onChange={handleInputChange('condition_name')}
                error={conditionNameError}
                helperText={conditionNameError ? "Please enter a Condition Name" : ""}
              />
            </Box>
          </Grid>
        </Grid>
        {conditionConflictError && (
          <Grid
            item
            xs={12}
            sx={{
              display: "flex",
              flexDirection: "row",
              paddingLeft: "18px",
              marginTop: "-20px",
              marginBottom: "15px",
              color: "#CE3E39",
            }}
          >
            This condition number already exists. Please enter a new one.
          </Grid>
        )}
      </Grid>

      <Grid container sx={{ paddingTop: "5px" }}>
        <Box
          sx={{
            boxShadow: "0px 2px 2px rgba(0, 0, 0, 0.1)",
            paddingTop: "0.5em",
            width: "100%"
          }}
        >
          {conditionData ? (
            <CreateConditionInfoTabs
              condition={condition}
              setCondition={setCondition}
            />
          ) : (
            <p>No condition details available.</p>
          )}
        </Box>
      </Grid>

      {preconditionFailedError && (
        <Modal open={modalOpen} onClose={handleModalClose}>
          <Paper
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90%",
              maxWidth: "500px",
              borderRadius: "4px",
              outline: "none",
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              padding={"14px 5px 14px 14px"}
            >
              <Typography variant="h6">
                {modalTitle}
              </Typography>
              <IconButton onClick={handleModalClose}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider />
            <Box
              component="div"
              padding={"14px"}
              sx={{
                color: "#CE3E39",
                fontSize: "14px"
              }}
              dangerouslySetInnerHTML={{
                __html: errorMessage || "A precondition failed while saving the condition.",
              }}
            />
          <DialogActions>
            <Button onClick={handleModalClose} color="secondary">
              Cancel
            </Button>
            <LoadingButton
              onClick={() => {
                handleSaveAndClose(); // Call the save function
              }}
              color="primary"
              loading={loading}
            >
              Confirm
            </LoadingButton>
          </DialogActions>
          </Paper>
        </Modal>
      )}

      <Button
        variant="contained"
        color="secondary"
        size="small"
        sx={{
          minWidth: "80px",
          padding: "4px 8px",
          borderRadius: "4px",
          marginTop: "25px",
          marginRight: "5px",
        }}
        onClick={handleRemove}
      >
        Cancel Condition
      </Button>

      <LoadingButton
        variant="contained"
        color="primary"
        size="small"
        loading={loading}
        sx={{
          minWidth: "80px",
          padding: "4px 8px",
          borderRadius: "4px",
          marginTop: "25px",
        }}
        onClick={handleSaveAndClose}
      >
        Save and Close
      </LoadingButton>
    </>
  );
};
