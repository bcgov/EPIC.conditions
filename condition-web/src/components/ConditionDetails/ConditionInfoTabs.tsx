import React, { useState } from 'react';
import { Box, Button, Stack, Tab, Tabs, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Save } from "@mui/icons-material";
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
    width: '260px',
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
    conditionNumber: number
    condition: ConditionModel;
    setCondition: React.Dispatch<React.SetStateAction<ConditionModel>>;
}> = ({ projectId, documentId, conditionNumber, condition, setCondition }) => {
    const [selectedTab, setSelectedTab] = useState('description');
    const [editMode, setEditMode] = useState(false);

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setSelectedTab(newValue);
    };

    const handleEditClick = () => {
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
                    <StyledTab label="Condition Description" value="description" />
                    <StyledTab label="Condition Attributes" value="attributes" />
                </StyledTabs>

                {/* Conditionally render the Edit button only if the "description" tab is selected */}
                {selectedTab === 'description' && (
                    <EditButton variant="contained" size="small" onClick={handleEditClick}>
                        {editMode ? (
                            <Typography component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                <Save fontSize="small" />
                                <Box component="span" sx={{ ml: 0.4 }}>Save Condition Description</Box>
                            </Typography>
                        ) : (
                            <Typography component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                <EditIcon fontSize="small" />
                                <Box component="span" sx={{ ml: 0.4 }}>Edit Condition Description</Box>
                            </Typography>
                        )}
                    </EditButton>
                )}
            </Stack>
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: selectedTab === 'description' ? 'block' : 'none' }}>
                    <ConditionDescription
                        editMode={editMode}
                        projectId={projectId}
                        documentId={documentId}
                        conditionNumber={conditionNumber}
                        condition={condition}
                        setCondition={setCondition}
                    />
                </Box>
                <Box sx={{ display: selectedTab === 'attributes' ? 'block' : 'none' }}>
                    <ConditionAttribute
                        projectId={projectId}
                        documentId={documentId}
                        condition={condition}
                        setCondition={setCondition}
                    />
                </Box>
            </Box>
        </>
    );
};

export default ConditionInfoTabs;
