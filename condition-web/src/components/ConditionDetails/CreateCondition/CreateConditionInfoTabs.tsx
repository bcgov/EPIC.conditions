import React, { useEffect, useState } from 'react';
import { Box, Button, Stack, Tab, Tabs } from '@mui/material';
import { styled } from '@mui/system';
import { BCDesignTokens } from 'epic.theme';
import AddIcon from '@mui/icons-material/Add';
import { theme } from "@/styles/theme";
import SubconditionComponent from "../SubCondition";
import { useSubconditionHandler } from "@/hooks/api/useSubconditionHandler";
import { ConditionModel } from "@/models/Condition";
import ConditionAttributeTable from '../ConditionAttribute/ConditionAttributeTable';

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
    projectId: string;
    documentId: string;
    condition: ConditionModel;
    setCondition: React.Dispatch<React.SetStateAction<ConditionModel>>;
}> = ({ projectId, documentId, condition, setCondition }) => {
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
                    {subconditions.map((sub, index) => (
                        <SubconditionComponent
                            key={index}
                            subcondition={sub}
                            indentLevel={1}
                            isEditing={true}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onAdd={handleAdd}
                            identifierValue={sub.subcondition_identifier || ""}
                            textValue={sub.subcondition_text || ""}
                            is_approved={false}
                        />
                    ))}
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
                                <AddIcon fontSize="small" /> Add Condition Sub-Section
                            </Button>
                        </Box>
                    </Stack>
                </Box>
                <Box sx={{ display: selectedTab === 'attributes' ? 'block' : 'none' }}>
                    <ConditionAttributeTable
                        projectId={projectId}
                        documentId={documentId}
                        condition={condition}
                        setCondition={setCondition}
                        origin={'create'}
                    />
                </Box>
            </Box>
        </>
    );
};

export default CreateConditionInfoTabs;
