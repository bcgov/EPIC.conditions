import { memo, useEffect, useState, useCallback, useRef } from 'react';
import { Box, Typography, Button, Stack } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { ConditionModel } from "@/models/Condition";
import { theme } from "@/styles/theme";
import { useUpdateConditionDetails } from "@/hooks/api/useConditions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { updateTopicTagsModel } from "@/models/Condition";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY } from "@/hooks/api/constants";
import { BCDesignTokens } from "epic.theme";
import SubconditionComponent from "./SubCondition";
import { useSubconditionHandler } from "@/hooks/api/useSubconditionHandler";
import { useHasAllowedRoles, KeycloakRoles } from "@/hooks/useAuthorization";
import {
  DragDropContext,
  Droppable,
  DropResult
} from '@hello-pangea/dnd';
import {
  indentSubcondition,
  reorderSubconditions,
  outdentSubcondition,
  ROOT_DROPPABLE_ID,
} from "./subconditionTree";

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
  projectId,
  documentId,
  conditionId,
  condition,
  setCondition,
  isConditionApproved,
  setIsConditionApproved,
  setIsLoading
}: ConditionDescriptionProps) => {
  const queryClient = useQueryClient();
  const canManage = useHasAllowedRoles([KeycloakRoles.MANAGE_CONDITIONS]);
  const [isEditing, setIsEditing] = useState(editMode);
  const [showEditingError, setShowEditingError] = useState(false);
  const [activeDroppableId, setActiveDroppableId] = useState<string | null>(null);

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
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEY.CONDITIONSDETAIL, projectId, documentId, conditionId],
    });
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

  // Track editing state in a ref so the sync effect doesn't add it as a dependency
  const isEditingRef = useRef(isEditing);
  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  // Sync subconditions from parent condition, but NOT while editing (to preserve local edits)
  useEffect(() => {
    if (!isEditingRef.current) {
      setSubconditions(condition.subconditions || []);
    }
  }, [condition.subconditions, setSubconditions]);

  // Track saveChanges in a ref so it doesn't trigger the effect on every subcondition change
  const saveChangesRef = useRef(saveChanges);
  useEffect(() => {
    saveChangesRef.current = saveChanges;
  }, [saveChanges]);

  // Only save when editMode transitions from true → false (user clicks "Save Condition Requirements")
  const prevEditModeRef = useRef(editMode);
  useEffect(() => {
    const prevEditMode = prevEditModeRef.current;
    prevEditModeRef.current = editMode;

    setIsEditing(editMode);

    if (prevEditMode && !editMode) {
      saveChangesRef.current();
    }
  }, [editMode]);

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

  const handleDragEnd = (result: DropResult) => {
    setActiveDroppableId(null);

    const { source, destination } = result;

    if (!destination) {
      return;
    }

    if (source.droppableId !== destination.droppableId) {
      return;
    }

    setSubconditions(
      reorderSubconditions(
        subconditions,
        source.droppableId,
        source.index,
        destination.index
      )
    );
  };

  const handleDragStart = (start: { source: { droppableId: string } }) => {
    setActiveDroppableId(start.source.droppableId);
  };

  const handleIndent = (subconditionId: string) => {
    setSubconditions(indentSubcondition(subconditions, subconditionId));
  };

  const handleOutdent = (subconditionId: string) => {
    setSubconditions(outdentSubcondition(subconditions, subconditionId));
  };

  if (!condition) {
    return <Typography>No condition available</Typography>;
  }

  return (
    <Box>
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Droppable
        droppableId={ROOT_DROPPABLE_ID}
        type="SUBCONDITION"
        isDropDisabled={
          activeDroppableId !== null && activeDroppableId !== ROOT_DROPPABLE_ID
        }
      >
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {subconditions.map((sub, index) => (
              <SubconditionComponent
                key={sub.subcondition_id}
                subcondition={sub}
                index={index}
                indentLevel={1}
                isEditing={isEditing}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAdd={handleAdd}
                onIndent={handleIndent}
                onOutdent={handleOutdent}
                activeDroppableId={activeDroppableId}
                identifierValue={sub.subcondition_identifier || ""}
                textValue={sub.subcondition_text || ""}
                is_approved={isConditionApproved || false}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      </DragDropContext>
      <Stack sx={{ mt: 5 }} direction={"row"}>
        <Box width="50%" sx={{ display: 'flex', justifyContent: 'flex-start' }}>
          {canManage && isEditing && (
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
            {canManage && (
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
            )}
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
