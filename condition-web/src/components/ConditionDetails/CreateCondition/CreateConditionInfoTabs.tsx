import React, { useEffect, useState } from 'react';
import { Box, Button, Stack, Tab, Tabs, Typography } from '@mui/material';
import { styled } from '@mui/system';
import { BCDesignTokens } from 'epic.theme';
import AddIcon from '@mui/icons-material/Add';
import { theme } from "@/styles/theme";
import { useSubconditionHandler } from "@/hooks/api/useSubconditionHandler";
import { ConditionModel } from "@/models/Condition";
import { SubconditionModel } from "@/models/Subcondition";
import ConditionAttribute from '../ConditionAttribute';
import { SortableTree } from '../SortableTree/SortableTree';

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

const CreateConditionInfoTabs: React.FC<{
    condition: ConditionModel;
    setCondition: React.Dispatch<React.SetStateAction<ConditionModel>>;
    isCreateMode?: boolean;
}> = ({ condition, setCondition, isCreateMode = false }) => {
    const [selectedTab, setSelectedTab] = useState('requirements');

    const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
        setSelectedTab(newValue);
    };

    const {
        subconditions,
        handleEdit,
        handleAdd,
        handleDelete,
        handleAddParentCondition,
        setSubconditions,
    } = useSubconditionHandler(condition.subconditions || []);

    const handleItemsChange = (newSubconditions: SubconditionModel[]) => {
        setSubconditions(newSubconditions);
    };

    useEffect(() => {
        setCondition((prevCondition) => ({
            ...prevCondition,
            subconditions: subconditions,
        }));
    }, [subconditions, setCondition]);

    useEffect(() => {
        setSubconditions(condition.subconditions || []);
    }, [condition.subconditions, setSubconditions]);

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

            </Stack>
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: selectedTab === 'requirements' ? 'block' : 'none' }}>
                    <SortableTree
                        items={subconditions}
                        onItemsChange={handleItemsChange}
                        isEditing={true}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onAdd={(subId: string) => handleAdd(subId)}
                        isApproved={false}
                    />
                    <Stack sx={{ mt: 5 }} direction={"row"}>
                        <Box width="50%" sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <Button
                                variant="contained"
                                color="secondary"
                                size="small"
                                sx={{
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    color: BCDesignTokens.themeGray100,
                                    border: `2px solid ${theme.palette.grey[700]}`,
                                }}
                                onClick={handleAddParentCondition}
                            >
                                <AddIcon fontSize="small" /> Add Condition Sub-section
                            </Button>
                        </Box>
                    </Stack>
                </Box>
                <Box sx={{ display: selectedTab === 'attributes' ? 'block' : 'none' }}>
                    {isCreateMode ? (
                        <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
                            Save the condition first to manage attributes.
                        </Typography>
                    ) : (
                        <ConditionAttribute
                            condition={condition}
                            setCondition={setCondition}
                        />
                    )}
                </Box>
            </Box>
        </>
    );
};

export default CreateConditionInfoTabs;
