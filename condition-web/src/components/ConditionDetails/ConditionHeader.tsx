import { useState } from "react";
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
    const [tags, setTags] = useState<string[]>(topicTags?topicTags:[]);
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
        <Grid container>
            <Grid item xs={12} sm={8}>
                <Box sx={{ height: '50px'}}>
                    <Grid
                        container
                        direction="row"
                        alignItems="center"
                        paddingBottom={1}
                        paddingTop={1}
                        sx={{ px: 2.5 }}
                    >
                        <Grid item xs={10} display="flex" alignItems="center">
                            <Typography variant="h6">{conditionName}</Typography>
                            <ContentCopyOutlinedIcon fontSize="small" sx={{ ml: 1, mr: 1 }} />
                            <DocumentStatusChip status={String(isApproved) as DocumentStatus} />
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
                <Box sx={{ height: '50px'}} position="relative">
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleEditClick}
                        sx={{
                            position: "absolute",
                            bottom: 0,
                            right: 21,
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
                                'Save Tags'
                            ) : (
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

            <Grid item xs={12} sm={6}>
                <Box
                    sx={{
                        height: '120px',
                        paddingLeft: 2.5,
                        paddingRight: 1,
                        paddingBottom: 1
                    }}
                >
                    <Stack
                        direction={"column"}
                        sx={{
                            width: '100%',
                            border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                            borderRadius: "3px",
                        }}
                    >
                        <Grid container direction="row" alignItems="center">
                            <Grid item xs={7} sx={{ height: "60px" }}>
                                <Stack direction="row" alignItems="flex-start">
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
                            <Grid item xs={5} sx={{ height: "60px" }}>
                                <Stack direction="row" alignItems="flex-start">
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
                        <Grid container direction="row" alignItems="center">
                            <Grid item xs={7} sx={{ height: "60px" }}>
                                <Stack direction="row" alignItems="flex-start">
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
                    </Stack>
                </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
                <Box
                    sx={{
                        height: '120px',
                        paddingLeft: 1,
                        paddingRight: 2.5,
                        paddingBottom: 1
                    }}
                >
                    <Stack
                        direction={"column"}
                        sx={{
                            width: '100%',
                            border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                            borderRadius: "3px",
                        }}
                    >
                        <Grid container direction="row" alignItems="center">
                            <Grid item xs={12} sx={{ height: "60px" }}>
                                <Stack direction="row" alignItems="flex-start">
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
                        </Grid>
                        <Grid container direction="row" alignItems="center">
                            <Grid
                                item
                                xs={12}
                                display="flex"
                                justifyContent="flex-end"
                                alignItems="flex-end"
                                sx={{ height: "60px" }}
                                paddingBottom={1}
                                paddingRight={1}
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
                    </Stack>
                </Box>
            </Grid>

        </Grid>
    );
};

export default ConditionHeader;
