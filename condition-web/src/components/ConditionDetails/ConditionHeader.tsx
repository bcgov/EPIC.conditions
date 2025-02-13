import { useEffect, useState } from "react";
import { Box, Button, Grid, Stack, Typography, TextField } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import DocumentStatusChip from "../Projects/DocumentStatusChip";
import { ConditionModel } from "@/models/Condition";
import { BCDesignTokens } from "epic.theme";
import { StyledTableHeadCell } from "../Shared/Table/common";
import { useUpdateConditionDetails } from "@/hooks/api/useConditions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { PartialUpdateTopicTagsModel } from "@/models/Condition";
import ChipInput from "../Shared/Chips/ChipInput";

type ConditionHeaderProps = {
    projectId: string;
    documentId: string;
    conditionId: number;
    projectName: string;
    documentLabel: string;
    condition: ConditionModel;
    setCondition: React.Dispatch<React.SetStateAction<ConditionModel>>;
};

const ConditionHeader = ({
    projectId,
    documentId,
    conditionId,
    projectName,
    documentLabel,
    condition,
    setCondition
}: ConditionHeaderProps) => {
    const [editConditionMode, setEditConditionMode] = useState(false);
    const [conditionNumber, setConditionNumber] = useState(condition?.condition_number || "");
    const [conditionName, setConditionName] = useState(condition?.condition_name || "");
    const [checkConditionExists, setCheckConditionExists] = useState(false);
    const [checkConditionExistsForProject, setCheckConditionExistsForProject] = useState(false);
    const [conditionConflictError, setConditionConflictError] = useState(false);
    const [approvalError, setApprovalError] = useState(false);
    const [approvalErrorMessage, setApprovalErrorMessage] = useState("");

    const [editMode, setEditMode] = useState(false);
    const [tags, setTags] = useState<string[]>(condition?.topic_tags || []);

    const onCreateFailure = () => {
      notify.error("Failed to save condition");
    };

    const onCreateSuccess = () => {
        notify.success("Condition saved successfully");
    };

    const { data: conditionDetails, mutateAsync: updateConditionDetails } = useUpdateConditionDetails(
        checkConditionExists,
        checkConditionExistsForProject,
        projectId,
        documentId,
        conditionId,
        {
          onSuccess: onCreateSuccess,
          onError: onCreateFailure,
        }
    );
  
    const handleEditClick = () => {
      setEditMode(!editMode);
      setConditionConflictError(false);
      setApprovalError(false);
      setApprovalErrorMessage('');
    };

    const handleEditToggle = () => {
      setConditionConflictError(false);
      setApprovalError(false);
      setApprovalErrorMessage('');
      setEditConditionMode((prev) => !prev);
    };

    const handleSave = async () => {
        setCheckConditionExists(true);
        setCheckConditionExistsForProject(true);

        const data: PartialUpdateTopicTagsModel = {};

        if (conditionNumber !== condition.condition_number) {
            data.condition_number = conditionNumber ? Number(conditionNumber) : condition.condition_number;
        }

        if (conditionName !== condition.condition_name) {
          data.condition_name = conditionName ? conditionName : condition.condition_name;
        }

        if (Object.keys(data).length > 0) {
          try {
            await updateConditionDetails(data);
            setEditConditionMode(false);
            setCheckConditionExists(false);
            setCheckConditionExistsForProject(false);
            setConditionConflictError(false);
            setApprovalErrorMessage('');
            setApprovalError(false);
          } catch (error) {
            if ((error as { response?: { data?: { message?: string }; status?: number } }).response?.status === 409) {
              setConditionConflictError(true);
            } else {
              notify.error("Failed to save condition.");
            }
          }
        }
    };

    useEffect(() => {
        if (conditionDetails) {
            setCondition((prevCondition) => ({
                ...prevCondition,
                ...conditionDetails,
                subconditions: prevCondition.subconditions,
            }));
        }
    }, [conditionDetails, setCondition]);

    const approveTags = (isApprovalAction = true) => {
        // Check if conditionName or conditionNumber is empty
        if (!condition.condition_name) {
          setApprovalError(true)
          setApprovalErrorMessage("Condition name is not entered.");
          return;
        }

        if (!condition.condition_number) {
          setApprovalError(true)
          setApprovalErrorMessage("Condition number is not entered.");
          return;
        }

        // Prepare the data for update
        const data: PartialUpdateTopicTagsModel = isApprovalAction
          ? { is_topic_tags_approved: !condition.is_topic_tags_approved }
          : { topic_tags: tags };
      
        updateConditionDetails(data);
    };

    const calculateWidth = (text: string) => {
      const baseWidth = 10;
      return `${Math.max(baseWidth * text.length, 50)}px`;
    };

    return (
      <>
        <Grid
          container
          direction={{ xs: "column", sm: "row" }}
          paddingBottom={condition.is_topic_tags_approved ? 1 : 5}
        >
          <Grid item xs={10} sx={{ padding: { xs: "10px", sm: "10px 10px 0px 10px" } }}>
            <Stack direction={"column"}>
              {editConditionMode ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                  }}
                >
                  <TextField 
                    variant="outlined" 
                    value={conditionNumber}
                    onChange={(e) => setConditionNumber(e.target.value)}
                    sx={{
                      width: '100px',
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "4px 0 0 4px",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderRadius: "4px 0 0 4px",
                      },
                    }}
                  />
                  <TextField 
                    variant="outlined" 
                    fullWidth
                    value={conditionName}
                    onChange={(e) => setConditionName(e.target.value)}
                    sx={{
                      width: calculateWidth(conditionName),
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "0px",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderRadius: "0px",
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSave}
                    sx={{
                      alignSelf: "stretch",
                      borderRadius: "0 4px 4px 0",
                      border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                      backgroundColor: BCDesignTokens.surfaceColorBackgroundLightGray,
                      height: '100%',
                      padding: '5px 0',
                      display: 'flex',
                      alignItems: 'center',
                      color: "black",
                      '&:hover': {
                        backgroundColor: BCDesignTokens.surfaceColorBorderDefault,
                      },
                    }}
                  >
                    <Typography component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                      <SaveAltIcon sx={{ color: "#255A90", mr: 1, ml: 1 }} fontSize="small" />
                      <Box component="span" sx={{ mr:2, color: "#255A90", fontWeight: "bold" }}>
                        Save
                      </Box>
                    </Typography>
                  </Button>
                </Box>
              ) : (
                <Stack direction="row">
                  <Box
                    sx={{
                      border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                      borderRadius: "4px 0 0 4px",
                      borderRight: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      padding: '1px 10px 0 10px',
                      backgroundColor: condition.is_topic_tags_approved ? '#F7F9FC' : 'inherit',
                    }}
                  >
                    <Typography variant="h6">
                      {conditionNumber ? `${conditionNumber}.` : conditionNumber} {conditionName}
                    </Typography>
                  </Box>
                  {!condition.is_topic_tags_approved && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleEditToggle}
                      sx={{
                        alignSelf: "stretch",
                        borderRadius: "0 4px 4px 0",
                        border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                        backgroundColor: BCDesignTokens.surfaceColorBackgroundLightGray,
                        height: '100%',
                        padding: '2.25px 0',
                        display: 'flex',
                        alignItems: 'center',
                        color: "black",
                        '&:hover': {
                          backgroundColor: BCDesignTokens.surfaceColorBorderDefault,
                        },
                      }}
                    >
                      <Typography component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                        <EditIcon sx={{ color: "#255A90", mr: 0.5 }} fontSize="small" />
                        <Box component="span" sx={{ mr: 1, color: "#255A90", fontWeight: "bold" }}>
                          Edit
                        </Box>
                      </Typography>
                    </Button>
                  )}
                </Stack>
              )}
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
                  This condition number already exists. Please enter a new one.
                </Box>
              )}
              {approvalError && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    marginBottom: "15px",
                    color: "#CE3E39",
                  }}
                >
                  {approvalErrorMessage}
                </Box>
              )}
            </Stack>
          </Grid>
          <Grid
            item
            xs={2}
            sx={{
              padding: { xs: "10px", sm: "10px 10px 0px 10px" },
              display: 'flex',
              justifyContent: 'flex-end'
            }}
          >
            <DocumentStatusChip
              status={
                condition?.is_approved
                && condition?.is_condition_attributes_approved
                && condition?.is_topic_tags_approved
                  ? "true"
                  : "false"
              }
            />
          </Grid>
        </Grid>
        <Grid container direction={{ xs: "column", sm: "row" }}>
          <Grid item xs={6} sx={{ padding: { xs: "10px", sm: "10px 5px 10px 10px" } }}>
            <Box
              sx={{
                border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                borderRadius: "4px",
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
            >
              <Grid container direction={{ xs: "column", sm: "row" }}>
                  <Grid item xs={8}>
                      <Stack direction="row" alignItems="flex-start" spacing={-2}>
                          <StyledTableHeadCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                              Project:
                          </StyledTableHeadCell>
                          <StyledTableHeadCell sx={{ verticalAlign: "top" }}>
                              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                  {projectName}
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
              <Grid container direction="row" marginBottom={1.5} marginTop={-2}>
                  <Grid container direction="row" alignItems="center">
                      <Grid item xs={12} sm={8} sx={{ height: "60px" }}>
                          <Stack direction="row" alignItems="flex-start" spacing={-2}>
                              <StyledTableHeadCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                                  Source:
                              </StyledTableHeadCell>
                              <StyledTableHeadCell sx={{ verticalAlign: "top" }}>
                                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                      {documentLabel}
                                  </Typography>
                              </StyledTableHeadCell>
                          </Stack>
                      </Grid>
                  </Grid>
              </Grid>
            </Box>
          </Grid>

          <Grid item xs={6} sx={{ padding: { xs: "10px", sm: "10px 10px 10px 5px" }, position: 'relative' }}>
            <Box
              sx={{
                border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                borderRadius: "4px",
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                backgroundColor: condition.is_topic_tags_approved ? '#F7F9FC' : 'inherit'
              }}
            >
              <Grid container direction="row">
                <Grid item xs={12}>
                  <Stack direction="row" alignItems="flex-start" spacing={-2}>
                    <StyledTableHeadCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                      Tags:
                    </StyledTableHeadCell>
                    <StyledTableHeadCell sx={{ verticalAlign: "top" }}>
                      {editMode ? (
                        <ChipInput
                          chips={tags}
                          setChips={setTags}
                          placeholder="Add tag"
                          inputWidth="100%"
                        />
                      ) : (
                        <Typography variant="body2" sx={{ ml: 1, wordBreak: 'break-word' }}>
                          {tags?.join(', ')}
                        </Typography>
                      )}
                    </StyledTableHeadCell>
                  </Stack>
                </Grid>
              </Grid>
            </Box>

            {!condition.is_topic_tags_approved && (
              <Button
                variant="contained"
                size="small"
                onClick={handleEditClick}
                sx={{
                  position: 'absolute', // Position it absolutely
                  top: -21,
                  right: 10,
                  borderRadius: "4px 4px 0 0",
                  border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                  backgroundColor: BCDesignTokens.surfaceColorBackgroundLightGray,
                  color: "black",
                  '&:hover': {
                    backgroundColor: BCDesignTokens.surfaceColorBorderDefault,
                  },
                }}
              > 
                {editMode ? (
                  <Typography
                    component="span"
                    sx={{ display: 'inline-flex', alignItems: 'center' }}
                    onClick={() => approveTags(false)}
                  >
                    <SaveAltIcon sx={{ color: "#255A90", mr: 0.5 }} fontSize="small" />
                    <Box component="span" sx={{ ml: 0.5, color: "#255A90", fontWeight: "bold" }}>
                      Save Tags
                    </Box>
                  </Typography>
                ) : (
                  <Typography component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                    <EditIcon sx={{ color: "#255A90", mr: 0.5 }} fontSize="small" />
                    <Box component="span" sx={{ ml: 0.5, color: "#255A90", fontWeight: "bold" }}>
                      Edit/Add Tags
                    </Box>
                  </Typography>
                )}
              </Button>
            )}
          </Grid>

          <Grid
            item
            xs={12}
            display="flex"
            justifyContent="flex-end"
            alignItems="flex-end"
            paddingRight={1}
            paddingBottom={1}
          >
            <Stack direction="row" spacing={1}>
                {!editMode &&
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        sx={{ padding: "4px 8px", borderRadius: "4px" }}
                        onClick={() => approveTags(true)}
                    >
                        {condition.is_topic_tags_approved ? 'Un-approve Condition Information' : 'Approve Condition Information'}
                    </Button>
                }
            </Stack>
          </Grid>
        </Grid>
      </>
    );
};

export default ConditionHeader;
