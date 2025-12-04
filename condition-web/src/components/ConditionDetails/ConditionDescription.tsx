import { memo, useEffect, useState, useCallback } from 'react';
import { Box, Typography, Button, Stack } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { ConditionModel } from "@/models/Condition";
import { SubconditionModel } from "@/models/Subcondition";
import { theme } from "@/styles/theme";
import { useUpdateConditionDetails } from "@/hooks/api/useConditions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { updateTopicTagsModel } from "@/models/Condition";
import { BCDesignTokens } from "epic.theme";
import SubconditionComponent from "./SubCondition";
import { useSubconditionHandler } from "@/hooks/api/useSubconditionHandler";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from '@hello-pangea/dnd';

type ConditionDescriptionProps = {
  editMode: boolean;
  projectId: string;
  documentId: string;
  conditionId: number;
  condition: ConditionModel;
  setCondition: React.Dispatch<React.SetStateAction<ConditionModel>>;
  isConditionApproved: boolean;
  setIsConditionApproved: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

// Main component to render the condition and its subconditions
const ConditionDescription = memo(({
  editMode,
  conditionId,
  condition,
  setCondition,
  isConditionApproved,
  setIsConditionApproved,
  setIsLoading
}: ConditionDescriptionProps) => {
  const [isEditing, setIsEditing] = useState(editMode);
  const [showEditingError, setShowEditingError] = useState(false);

  const {
    subconditions,
    handleEdit,
    handleAdd,
    handleDelete,
    handleAddParentCondition,
    setSubconditions,
  } = useSubconditionHandler(condition.subconditions || []);

  const onCreateFailure = () => {
    notify.error("Failed to save condition");
  };

  const onCreateSuccess = () => {
    notify.success("Condition saved successfully");
  };

  const { data: conditionDetails, mutate: updateConditionDetails } = useUpdateConditionDetails(
    false,
    false,
    conditionId,
    {
      onSuccess: onCreateSuccess,
      onError: onCreateFailure,
    }
  );

  const saveChanges = useCallback(() => {
    const data: updateTopicTagsModel = {
      subconditions: subconditions
    };
    updateConditionDetails(data);
  }, [subconditions, updateConditionDetails]);

  useEffect(() => {
    setSubconditions(condition.subconditions || []);
  }, [condition.subconditions, setSubconditions]);

  useEffect(() => {
    setIsEditing(editMode);
    if (isEditing) {
      // On save, submit changedValues to the backend
      saveChanges();
    }
  }, [editMode, isEditing, saveChanges]);

  useEffect(() => {
    if (conditionDetails) {
      setIsConditionApproved(conditionDetails.is_approved)
      setCondition((prevCondition) => ({
        ...prevCondition,
        ...conditionDetails,
        subconditions: prevCondition.subconditions,
      }));
      setIsLoading(false);
    }
  }, [conditionDetails, setCondition, setIsConditionApproved, setIsLoading]);
  
  const approveConditionDescription = () => {
    if (isEditing) {
      setShowEditingError(true);
      return;
    }

    setShowEditingError(false);

    const data: updateTopicTagsModel = {
      is_approved: !isConditionApproved }
    updateConditionDetails(data);
  };

  const buildSortOrderMap = (
    items: SubconditionModel[],
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
    nodes: SubconditionModel[],
    sortOrderMap: Record<string, number>,
    parentId: string | null = null
  ): SubconditionModel[] => {
    const apply = (items: SubconditionModel[], parentId: string): SubconditionModel[] => {
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
    items: SubconditionModel[],
    parentId: string | null,
    sourceIndex: number,
    destinationIndex: number
  ): SubconditionModel[] => {
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

  if (!condition) {
    return <Typography>No condition available</Typography>;
  }

  return (
    <Box>
      <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="subconditions-droppable" type="SUBCONDITION">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {subconditions.map((sub, index) => (
              <Draggable
                key={sub.subcondition_id}
                draggableId={sub.subcondition_id}
                index={index}
                isDragDisabled={!isEditing}
              >
                {(dragProvided) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    style={{ ...dragProvided.draggableProps.style }}
                  >
                    <SubconditionComponent
                      subcondition={sub}
                      indentLevel={1}
                      isEditing={isEditing}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onAdd={handleAdd}
                      identifierValue={sub.subcondition_identifier || ""}
                      textValue={sub.subcondition_text || ""}
                      is_approved={isConditionApproved || false}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      </DragDropContext>
      <Stack sx={{ mt: 5 }} direction={"row"}>
        <Box width="50%" sx={{ display: 'flex', justifyContent: 'flex-start' }}>
          {isEditing && (
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
          )}
        </Box>
        <Box width="50%" sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Button
                variant="contained"
                color="primary"
                size="small"
                sx={{
                  width: "260px", 
                  padding: "4px 8px",
                  borderRadius: "4px",
                }}
                onClick={approveConditionDescription}
            >
              {isConditionApproved ?
              'Un-approve Condition Requirements' : 'Approve Condition Requirements'}
            </Button>
            {showEditingError && isEditing && (
              <Box
                sx={{
                  color: "#CE3E39",
                  fontSize: "14px",
                  marginTop: 1,
                  marginBottom: "15px",
                  textAlign: 'right',
                }}
              >
                Please navigate to the top of this section to save your changes before approving Condition Requirements.
              </Box>
            )}
          </Box>
        </Box>
      </Stack>
    </Box>
  );
});

export default ConditionDescription;
