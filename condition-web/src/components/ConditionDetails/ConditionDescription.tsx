import { memo, useEffect, useState } from 'react';
import { Box, Typography, Button, Stack } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { ConditionModel } from "@/models/Condition";
import { theme } from "@/styles/theme";
import { useUpdateConditionDetails } from "@/hooks/api/useConditions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { updateTopicTagsModel } from "@/models/Condition";
import { BCDesignTokens } from "epic.theme";
import SubconditionComponent from "./SubCondition";
import { useSubconditionHandler } from "@/hooks/api/useSubconditionHandler";

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
  const [isEditing, setIsEditing] = useState(editMode);

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
    projectId,
    documentId,
    conditionId,
    {
      onSuccess: onCreateSuccess,
      onError: onCreateFailure,
    }
  );

  useEffect(() => {
    setSubconditions(condition.subconditions || []);
  }, [condition.subconditions, setSubconditions]);

  useEffect(() => {
    setIsEditing(editMode);
    if (isEditing) {
      // On save, submit changedValues to the backend
      saveChanges();
    }
  }, [editMode, isEditing]);

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
  }, [conditionDetails]);
  
  const approveConditionDescription = () => {
    const data: updateTopicTagsModel = {
      is_approved: !isConditionApproved }
    updateConditionDetails(data);
  };

  const saveChanges = () => {
    const data: updateTopicTagsModel = {
      subconditions: subconditions
    };
    updateConditionDetails(data);
  };

  if (!condition) {
    return <Typography>No condition available</Typography>;
  }

  return (
    <Box>
      {subconditions.map((sub, index) => (
        <SubconditionComponent
          key={index}
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
      ))}
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
        </Box>
      </Stack>
    </Box>
  );
});

export default ConditionDescription;
