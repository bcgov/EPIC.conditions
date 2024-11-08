import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, TextField } from "@mui/material";
import { ConditionModel } from "@/models/Condition";
import { SubconditionModel } from "@/models/Subcondition";
import { theme } from "@/styles/theme";
import { useLoadConditionDetails } from "@/hooks/api/useConditions";
import { useUpdateSubconditions } from "@/hooks/api/useSubConditions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";

// Recursive component to render each subcondition
const SubconditionComponent: React.FC<{
  subcondition: SubconditionModel; 
  indentLevel: number; 
  isEditing: boolean; 
  onEdit: (id: string, newIdentifier: string, newText: string) => void; 
  identifierValue: string;
  textValue: string;
}> = ({ subcondition, indentLevel, isEditing, onEdit, identifierValue, textValue }) => {
  
  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEdit(subcondition.subcondition_id, e.target.value ?? '', textValue);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEdit(subcondition.subcondition_id, identifierValue, e.target.value ?? '');
  };

  return (
    <>
      <Box 
        sx={{ 
          padding: '8px 12px', 
          backgroundColor: '#FAF9F8', 
          borderRadius: '3px', 
          border: `1px solid ${theme.palette.primary.light}`,
          marginBottom: '10px',
          marginLeft: indentLevel > 1 ? `${indentLevel * 20}px` : '0px', 
          display: 'flex', 
          gap: '8px'
        }}
      >
        {isEditing ? (
          <>
            <TextField 
              variant="outlined" 
              value={identifierValue}
              onChange={handleIdentifierChange}
              sx={{ width: '100px' }}
            />
            <TextField 
              variant="outlined" 
              multiline 
              fullWidth 
              value={textValue}
              onChange={handleTextChange}
              InputProps={{ sx: { padding: '4px 8px', fontSize: '14px' } }}
            />
          </>
        ) : (
          <Typography variant="body2">
            <span style={{ color: theme.palette.primary.dark, marginRight: '8px' }}>
                {subcondition.subcondition_identifier}
            </span>
            {subcondition.subcondition_text}
          </Typography>
        )}
      </Box>

      {/* Render nested subconditions recursively */}
      {subcondition.subconditions?.map((nestedSub, index) => (
        <SubconditionComponent 
          key={`${nestedSub.subcondition_id}-${index}`} 
          subcondition={nestedSub} 
          indentLevel={indentLevel + 1} 
          isEditing={isEditing}
          onEdit={onEdit} 
          identifierValue={nestedSub.subcondition_identifier}
          textValue={nestedSub.subcondition_text}
        />
      ))}
    </>
  );
};

// Main component to render the condition and its subconditions
const ConditionDescription: React.FC<{
  editMode: boolean,
  condition?: ConditionModel
  projectId: String,
  documentId: String,
  conditionNumber: Number
}> = ({ editMode, condition, projectId, documentId, conditionNumber }) => {
  const [isEditing, setIsEditing] = useState(editMode);
  const [updatedCondition, setUpdatedCondition] = useState<ConditionModel | undefined>(condition);
  const [changedValues, setChangedValues] = useState<{ [key: string]: Partial<SubconditionModel> }>({});

  const onCreateFailure = () => {
    notify.error("Failed to save condition");
  };

  const onCreateSuccess = () => {
    notify.success("Condition saved successfully");
    refetchConditionDetails();
  };

  const { data: conditionDetails, refetch: refetchConditionDetails } = useLoadConditionDetails(projectId.toString(), documentId.toString(), parseInt(conditionNumber.toString()));

  useEffect(() => {
    if (conditionDetails) {
      setUpdatedCondition(conditionDetails.condition); // Update local state when condition details are loaded
    }
  }, [conditionDetails]);

  // useUpdateSubconditions hook to update subconditions
  const { mutate: updateSubconditionsMutate } = useUpdateSubconditions({
    subconditions: Object.entries(changedValues).map(([id, data]) => ({
      subcondition_id: id,
      subcondition_identifier: data.subcondition_identifier || '',
      subcondition_text: data.subcondition_text || '',
    })),
    options: {
      onSuccess: onCreateSuccess,
      onError: onCreateFailure,
    },
  });

  if (!condition) {
    return <Typography>No condition available</Typography>;
  }
  
  useEffect(() => {
    setIsEditing(editMode);
    if (isEditing) {
      // On save, submit changedValues to the backend
      saveChanges();
    }
  }, [editMode]);

  const handleEdit = (id: string, newIdentifier: string, newText: string) => {
    if (!updatedCondition) return;

    const updateSubcondition = (subconds: SubconditionModel[]): SubconditionModel[] => {
      return subconds.map((sub) => {
        if (sub.subcondition_id === id) {
          setChangedValues((prev) => ({
            ...prev,
            [id]: { ...prev[id], subcondition_identifier: newIdentifier, subcondition_text: newText }
          }));
          return { ...sub, subcondition_identifier: newIdentifier, subcondition_text: newText };
        }
        if (sub.subconditions) {
          return { ...sub, subconditions: updateSubcondition(sub.subconditions) };
        }
        return sub;
      });
    };

    setUpdatedCondition({
      ...updatedCondition,
      subconditions: updateSubcondition(updatedCondition.subconditions || []),
    });
  };

  const saveChanges = () => {
    updateSubconditionsMutate();
  };

  return (
    <Box>
      {updatedCondition?.subconditions?.map((sub, index) => {
        const values = changedValues[sub.subcondition_id] || {
          subcondition_identifier: sub.subcondition_identifier,
          subcondition_text: sub.subcondition_text,
        };
        return (
          <SubconditionComponent 
            key={index} 
            subcondition={sub} 
            indentLevel={1} 
            isEditing={isEditing}
            onEdit={handleEdit}
            identifierValue={values.subcondition_identifier || ''}
            textValue={values.subcondition_text || ''}
          />
        );
      })}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 5 }}>
        <Button
            variant="contained"
            color="primary"
            size="small"
            sx={{
              width: "250px", 
              padding: "4px 8px",
              borderRadius: "4px",
            }}
            onClick={() => console.log('Approved')}
        >
          Approve Condition Description
        </Button>
      </Box>
    </Box>
  );
};

export default ConditionDescription;
