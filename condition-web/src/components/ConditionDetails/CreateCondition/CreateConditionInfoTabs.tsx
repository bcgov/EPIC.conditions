import React, { useEffect, useState } from 'react';
import { Box, Button, Stack, Tab, Tabs } from '@mui/material';
import { styled } from '@mui/system';
import { BCDesignTokens } from 'epic.theme';
import AddIcon from '@mui/icons-material/Add';
import { theme } from "@/styles/theme";
import SubconditionComponent from "../SubCondition";
import { useSubconditionHandler } from "@/hooks/api/useSubconditionHandler";
import { ConditionModel } from "@/models/Condition";
import ConditionAttribute from '../ConditionAttribute';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';

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
}> = ({ condition, setCondition }) => {
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

    const buildSortOrderMap = (
        items: any[],
        parentId: string = "null",
        map: Record<string, number> = {}
    ): Record<string, number> => {
        return items.reduce((acc, item, index) => {
          const key = `${parentId}-${item.subcondition_id}`;
          acc[key] = index;
          return item.subconditions?.length
            ? buildSortOrderMap(item.subconditions, item.subcondition_id, acc)
            : acc;
        }, map);
    };
      
    const applySortOrder = (
        nodes: any[],
        sortOrderMap: Record<string, number>,
        parentId: string | null = null
    ): any[] => {
        const apply = (items: any[], parentId: string): any[] => {
          return items
            .map((item) => ({
              ...item,
              subconditions: item.subconditions
                ? apply(item.subconditions, item.subcondition_id)
                : [],
            }))
            .sort((a, b) => {
              const keyA = `${parentId}-${a.subcondition_id}`;
              const keyB = `${parentId}-${b.subcondition_id}`;
              return (sortOrderMap[keyA] ?? 0) - (sortOrderMap[keyB] ?? 0);
            });
        };
      
        return apply(nodes, parentId ?? "null");
    };
    
    const reorderNested = (
        items: any[],
        parentId: string | null,
        sourceIndex: number,
        destinationIndex: number
    ): any[] => {
        if (parentId === "subconditions-droppable") {
          const newItems = [...items];
          const [moved] = newItems.splice(sourceIndex, 1);
          newItems.splice(destinationIndex, 0, moved);
          return newItems;
        }
      
        return items.map((item) => {
          if (item.subcondition_id === parentId && item.subconditions) {
            const newSub = [...item.subconditions];
            const [moved] = newSub.splice(sourceIndex, 1);
            newSub.splice(destinationIndex, 0, moved);
            return {
              ...item,
              subconditions: newSub,
            };
          }
          return {
            ...item,
            subconditions: item.subconditions
              ? reorderNested(item.subconditions, parentId, sourceIndex, destinationIndex)
              : [],
          };
        });
    }; 
    
    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;
    
        const sourceId = result.source.droppableId;
        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;
    
        const reordered = reorderNested(subconditions, sourceId, sourceIndex, destinationIndex);
        const sortOrderMap = buildSortOrderMap(reordered);
        const sorted = applySortOrder(reordered, sortOrderMap);
        setSubconditions(sorted);
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
                    <DragDropContext onDragEnd={handleDragEnd}>
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
                    </DragDropContext>
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
                    <ConditionAttribute
                        condition={condition}
                        setCondition={setCondition}
                    />
                </Box>
            </Box>
        </>
    );
};

export default CreateConditionInfoTabs;
