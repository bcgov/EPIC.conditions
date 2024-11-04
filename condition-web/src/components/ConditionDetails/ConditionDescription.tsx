import React, { useState } from 'react';
import { Box, Typography, Button, TextField } from "@mui/material";
import { ConditionModel } from "@/models/Condition";
import { SubconditionModel } from "@/models/Subcondition";
import { theme } from "@/styles/theme";
import { useUpdateSubconditions } from "@/hooks/api/useSubConditions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";

// Recursive component to render each subcondition
const SubconditionComponent: React.FC<{ 
  subcondition: SubconditionModel; 
  indentLevel: number; 
  isEditing: boolean; 
  onEdit: (id: string, newIdentifier: string, newText: string) => void; 
  identifierValue: string; // Added prop for identifier value
  textValue: string; // Added prop for text value
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
              value={identifierValue} // Use the edited value
              onChange={handleIdentifierChange}
              sx={{ width: '100px' }}
            />
            <TextField 
              variant="outlined" 
              multiline 
              fullWidth 
              value={textValue} // Use the edited value
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
          identifierValue={nestedSub.subcondition_identifier} // Pass the identifier
          textValue={nestedSub.subcondition_text} // Pass the text
        />
      ))}
    </>
  );
};

// Main component to render the condition and its subconditions
const ConditionDescription: React.FC<{ condition?: ConditionModel }> = ({ condition }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [updatedCondition, setUpdatedCondition] = useState<ConditionModel | undefined>(condition);
  const [changedValues, setChangedValues] = useState<{ [key: string]: Partial<SubconditionModel> }>({});

  const onCreateFailure = () => {
    notify.error("Failed to save submission");
  };

  const onCreateSuccess = () => {
    notify.success("Submission saved successfully");
  };

  // useUpdateSubconditions hook to update subconditions
  const { mutate: updateSubconditionsMutate } = useUpdateSubconditions({
    subconditions: Object.entries(changedValues).map(([id, data]) => ({
      subcondition_id: id,  // Convert id to number here
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

  const toggleEditing = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // On save, submit changedValues to the backend
      saveChanges();
    }
  };

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
    updateSubconditionsMutate();  // Trigger the mutation for updating subconditions
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
        <Button
            variant="contained"
            color="primary"
            sx={{ minWidth: '120px' }}
            onClick={() => console.log('Approved')}
        >
          Approve
        </Button>
        <Button
            variant="contained"
            color="secondary"
            sx={{ minWidth: '120px' }}
            onClick={toggleEditing}
        >
          {isEditing ? 'Save' : 'Edit'}
        </Button>
      </Box>

      {updatedCondition?.subconditions?.map((sub, index) => {
        const values = changedValues[sub.subcondition_id] || { // Use changedValues for the identifier and text
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
            identifierValue={values.subcondition_identifier || ''} // Pass edited identifier value
            textValue={values.subcondition_text || ''} // Pass edited text value
          />
        );
      })} 
    </Box>
  );
};

export default ConditionDescription;
