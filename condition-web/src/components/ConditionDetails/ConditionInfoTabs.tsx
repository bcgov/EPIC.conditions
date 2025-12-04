import React, { useState } from 'react';
import { Box, Button, CircularProgress, Stack, Tab, Tabs, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import { styled } from '@mui/system';
import { BCDesignTokens } from 'epic.theme';
import ConditionAttribute from './ConditionAttribute';
import ConditionDescription from './ConditionDescription';
import { ConditionModel } from "@/models/Condition";

const StyledTabs = styled(Tabs)({
    transition: 'none',
    minHeight: 0,
    borderBottom: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`
});

const StyledTab = styled(Tab)(({ theme }) => ({
    height: '31px',
    minHeight: 0,
    color: theme.palette.secondary.main,
    fontWeight: 'inherit',
    backgroundColor: '#EDEBE9',
    marginRight: '4px',
    borderTopLeftRadius: '4px',
    borderTopRightRadius: '4px',
    border: '1px solid transparent',
    borderBottom: 'none',

    '&.Mui-selected': {
        color: theme.palette.primary.contrastText,
        backgroundColor: theme.palette.primary.main,
        border: `1px solid ${theme.palette.primary.main}`,
        borderBottom: 'none',
        fontWeight: 700,
    },

    '&:not(.Mui-selected)': {
        color: BCDesignTokens.surfaceColorBorderDark,
    },
}));

const EditButton = styled(Button)({
    height: '32px',
    width: '280px',
    borderRadius: "4px 4px 0 0",
    marginLeft: 'auto',
    border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
    backgroundColor: BCDesignTokens.surfaceColorBackgroundLightGray,
    color: 'black',
    '&:hover': {
        backgroundColor: BCDesignTokens.surfaceColorBorderDefault,
    },
});

const ConditionInfoTabs: React.FC<{
    projectId: string,
    documentId: string,
    conditionId: number
    condition: ConditionModel;
    setCondition: React.Dispatch<React.SetStateAction<ConditionModel>>;
}> = ({ projectId, documentId, conditionId, condition, setCondition }) => {
    const [selectedTab, setSelectedTab] = useState('requirements');
    const [editMode, setEditMode] = useState(false);
    const [isConditionApproved, setIsConditionApproved] = useState(condition.is_approved || false);
    const [isLoading, setIsLoading] = useState(false);

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setSelectedTab(newValue);
    };

    const handleEditClick = () => {
        setIsLoading(true);
        setEditMode((prev) => !prev);
    };

    return (
        <>
            <Stack
                direction="row"
                alignItems="center"
                sx={{
                    borderBottom: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`
                }}
            >
                <StyledTabs value={selectedTab} onChange={handleTabChange} aria-label="Condition details tabs">
                    <StyledTab label="Condition Requirements" value="requirements" />
                    <StyledTab label="Condition Attributes" value="attributes" />
                </StyledTabs>

                {/* Conditionally render the Edit button only if the "requirements" tab is selected */}
                {selectedTab === 'requirements' && !isConditionApproved && (
                    <EditButton
                        variant="contained"
                        size="small"
                        onClick={handleEditClick}
                        disabled={isLoading}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            whiteSpace: 'nowrap',
                            position: 'relative',
                        }}
                    >
                        {isLoading ? (
                            <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                        ) : (
                            <>
                                {editMode ? (
                                    <Typography component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                        <SaveAltIcon
                                            sx={{ color: "#255A90", mr: 0.5 }}
                                            fontSize="small"
                                        />
                                        <Box
                                            component="span"
                                            sx={{ ml: 0.5, color: "#255A90", fontWeight: "bold" }}
                                        >
                                            Save Condition Requirements
                                        </Box>
                                    </Typography>
                                ) : (
                                    <Typography component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                        <EditIcon
                                            sx={{ color: "#255A90", mr: 0.5 }}
                                            fontSize="small"
                                        />
                                        <Box
                                            component="span"
                                            sx={{ ml: 0.5, color: "#255A90", fontWeight: "bold" }}
                                        >
                                            Edit Condition Requirements
                                        </Box>
                                    </Typography>
                                )}
                            </>
                        )}
                    </EditButton>
                )}
            </Stack>
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: selectedTab === 'requirements' ? 'block' : 'none' }}>
                    <ConditionDescription
                        editMode={editMode}
                        projectId={projectId}
                        documentId={documentId}
                        conditionId={conditionId}
                        condition={condition}
                        isConditionApproved={isConditionApproved}
                        setIsConditionApproved={setIsConditionApproved}
                        setCondition={setCondition}
                        setIsLoading={setIsLoading}
                    />
                </Box>
                <Box sx={{ display: selectedTab === 'attributes' ? 'block' : 'none' }}>
                    <ConditionAttribute
                        condition={condition}
                        setCondition={setCondition}
                    />
                </Box>
            </Box>
        </>
    );
};

export default ConditionInfoTabs;
