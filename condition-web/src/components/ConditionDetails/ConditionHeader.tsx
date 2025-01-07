import { useEffect, useState } from "react";
import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import EditIcon from '@mui/icons-material/Edit';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import DocumentStatusChip from "../Projects/DocumentStatusChip";
import { ConditionModel } from "@/models/Condition";
import { DocumentStatus } from "@/models/Document";
import { BCDesignTokens } from "epic.theme";
import { StyledTableHeadCell } from "../Shared/Table/common";
import { useUpdateConditionDetails } from "@/hooks/api/useConditions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { PartialUpdateTopicTagsModel } from "@/models/Condition";
import ChipInput from "../Shared/Chips/ChipInput";

type ConditionHeaderProps = {
    projectId: string;
    documentId: string;
    conditionNumber: number;
    projectName: string;
    documentLabel: string;
    condition: ConditionModel;
    setCondition: React.Dispatch<React.SetStateAction<ConditionModel>>;
};

const ConditionHeader = ({
    projectId,
    documentId,
    conditionNumber,
    projectName,
    documentLabel,
    condition,
    setCondition
}: ConditionHeaderProps) => {
    const [editMode, setEditMode] = useState(false);
    const [tags, setTags] = useState<string[]>(condition?.topic_tags || []);

    const handleEditClick = () => {
        setEditMode(!editMode);
    };

    const onCreateFailure = () => {
        notify.error("Failed to save condition");
    };

    const onCreateSuccess = () => {
        notify.success("Condition saved successfully");
    };

    const { data: conditionDetails, mutate: updateConditionDetails } = useUpdateConditionDetails(
        projectId,
        documentId,
        conditionNumber,
        {
          onSuccess: onCreateSuccess,
          onError: onCreateFailure,
        }
    );

    useEffect(() => {
        if (conditionDetails) {
            setCondition((prevCondition) => ({
                ...prevCondition,
                ...conditionDetails,
            }));
        }
    }, [conditionDetails, setCondition]);

    const approveTags = (isApprovalAction = true) => {
        const data: PartialUpdateTopicTagsModel = isApprovalAction
          ? { is_topic_tags_approved: !condition.is_topic_tags_approved }
          : { topic_tags: tags };
      
        updateConditionDetails(data);
    };

    return (
        <Grid container>
            <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 1 }}>
                    <Typography variant="h6">{condition?.condition_name}</Typography>
                    <LayersOutlinedIcon fontSize="small" sx={{ ml: 1, mr: 1 }} />
                    <DocumentStatusChip status={String(condition?.is_approved) as DocumentStatus} />
                    {!condition.is_topic_tags_approved && (
                        <Button
                            variant="contained"
                            size="small"
                            onClick={handleEditClick}
                            sx={{
                                ml: 'auto',
                                right: -3,
                                top: 9,
                                borderRadius: "4px 4px 0 0",
                                border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                                backgroundColor: BCDesignTokens.surfaceColorBackgroundLightGray,
                                color: "black",
                                '&:hover': {
                                    backgroundColor: BCDesignTokens.surfaceColorBorderDefault,
                                },
                            }}
                        >
                            {editMode ?
                                <Typography
                                    component="span"
                                    sx={{ display: 'inline-flex', alignItems: 'center' }}
                                    onClick={() => approveTags(false)}
                                >
                                    <SaveAltIcon
                                        sx={{ color: "#255A90", mr: 0.5 }}
                                        fontSize="small"
                                    />
                                    <Box
                                        component="span"
                                        sx={{ ml: 0.5, color: "#255A90", fontWeight: "bold" }}
                                    >
                                        Save Tags
                                    </Box>
                                </Typography>
                            : (
                                <Typography component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                    <EditIcon
                                        sx={{ color: "#255A90", mr: 0.5 }}
                                        fontSize="small"
                                    />
                                    <Box
                                        component="span"
                                        sx={{ ml: 0.5, color: "#255A90", fontWeight: "bold" }}
                                    >
                                        Edit/Add Tags
                                    </Box>
                                </Typography>
                            )}
                        </Button>
                    )}
                </Box>
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <Stack direction="row" sx={{ paddingLeft: 2, paddingRight: 2, paddingBottom: 1, height: '100%' }}>
                    <Box sx={{ paddingRight: 1, height: '100%', width: '100%' }}>
                        <Box
                            sx={{
                                border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                                borderRadius: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%'
                            }}
                        >
                            <Grid container direction="row">
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
                                    <Grid item xs={8} sx={{ height: "60px" }}>
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
                    </Box>

                    <Box sx={{ paddingLeft: 1, height: '100%', width: '100%' }}>
                        <Box
                            sx={{
                                border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                                borderRadius: 1,
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
                                <Grid
                                    item
                                    xs={12}
                                    display="flex"
                                    justifyContent="flex-end"
                                    alignItems="flex-end"
                                    paddingRight={1}
                                    paddingTop={2}
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
                                                {condition.is_topic_tags_approved ? 'Un-approve Tags' : 'Approve Tags'}
                                            </Button>
                                        }
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                </Stack>
            </Grid>
        </Grid>
    );
};

export default ConditionHeader;
