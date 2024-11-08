import React, { useState } from "react";
import { Box, Button, Chip, Grid, Stack, TextField, Typography } from "@mui/material";
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import EditIcon from '@mui/icons-material/Edit';
import DocumentStatusChip from "../Documents/DocumentStatusChip";
import { DocumentStatus } from "@/models/Document";
import { BCDesignTokens } from "epic.theme";
import { StyledTableHeadCell } from "../Shared/Table/common";

type ConditionHeaderProps = {
    projectName: string;
    documentName: string;
    yearIssued?: number;
    topicTags?: string[];
    conditionName?: string;
    isApproved?: boolean;
};

const ConditionHeader = ({
    projectName,
    documentName,
    yearIssued,
    topicTags,
    conditionName,
    isApproved,
}: ConditionHeaderProps) => {
    const [editMode, setEditMode] = useState(false);
    const [tags, setTags] = useState<string[]>(topicTags || []);
    const [newTag, setNewTag] = useState("");

    const handleEditClick = () => {
        setEditMode(!editMode);
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleAddTag = () => {
        if (newTag && !tags.includes(newTag)) {
            setTags([...tags, newTag]);
            setNewTag("");
        }
    };

    return (
        <Grid container alignItems="stretch">
            <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 1 }}>
                    <Typography variant="h6">{conditionName}</Typography>
                    <ContentCopyOutlinedIcon fontSize="small" sx={{ ml: 1, mr: 1 }} />
                    <DocumentStatusChip status={String(isApproved) as DocumentStatus} />
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
                            <Typography component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                <Box component="span" sx={{ ml: 0.5 }}>
                                    Save Tags
                                </Box>
                            </Typography>
                        : (
                            <Typography component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                <EditIcon fontSize="small" />
                                <Box component="span" sx={{ ml: 0.5 }}>
                                    Edit/Add Tags
                                </Box>
                            </Typography>
                        )}
                    </Button>
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
                                                {yearIssued}
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
                                                    {documentName}
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
                                height: '100%'
                            }}
                        >
                             <Grid container direction="row">
                                <Grid item xs={12}>
                                    <Stack direction="row" alignItems="flex-start" spacing={-2}>
                                        <StyledTableHeadCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                                            Topic(s):
                                        </StyledTableHeadCell>
                                        <StyledTableHeadCell sx={{ verticalAlign: "top" }}>
                                            {editMode ? (
                                                <Box>
                                                    {tags.map(tag => (
                                                        <Chip
                                                            key={tag}
                                                            label={tag}
                                                            onDelete={() => handleRemoveTag(tag)}
                                                            sx={{
                                                                marginLeft: 1,
                                                                backgroundColor: "#F7F9FC",
                                                                color: "black",
                                                                fontSize: "14px"
                                                            }}
                                                        />
                                                    ))}
                                                    <TextField
                                                        variant="outlined"
                                                        size="small"
                                                        value={newTag}
                                                        onChange={(e) => setNewTag(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") handleAddTag();
                                                        }}
                                                        placeholder="Add tag"
                                                        sx={{ marginLeft: 1, width: "auto", flexShrink: 0 }}
                                                    />
                                                </Box>
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
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            size="small"
                                            sx={{ padding: "4px 8px", borderRadius: "4px" }}
                                        >
                                            Approve Tags
                                        </Button>
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
