import React, { useEffect, useState } from 'react';
import { Box, IconButton, Typography, Button, TextField, Stack } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import Delete from "@mui/icons-material/Delete";
import { ConditionModel } from "@/models/Condition";
import { SubconditionModel } from "@/models/Subcondition";
import { theme } from "@/styles/theme";
import { useUpdateConditionDetails } from "@/hooks/api/useConditions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { updateTopicTagsModel } from "@/models/Condition";
import { BCDesignTokens } from "epic.theme";

// Recursive component to render each subcondition
const SubconditionComponent: React.FC<{
  subcondition: SubconditionModel; 
  indentLevel: number; 
  isEditing: boolean; 
  onEdit: (id: string, newIdentifier: string, newText: string) => void;
  onDelete: (id: string) => void;
  onAdd: (parentId: string) => void;
  identifierValue: string;
  textValue: string;
}> = ({ subcondition, indentLevel, isEditing, onEdit, onDelete, onAdd, identifierValue, textValue }) => {
  
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
            <Box display="flex" alignItems="center" sx={{ paddingLeft: '4px', paddingBottom: 3 }}>
              <IconButton size="small" onClick={() => onAdd(subcondition.subcondition_id)}>
                <AddIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => onDelete(subcondition.subcondition_id)}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>
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
          onDelete={onDelete}
          onAdd={onAdd}
          identifierValue={nestedSub.subcondition_identifier}
          textValue={nestedSub.subcondition_text}
        />
      ))}
    </>
  );
};

type ConditionDescriptionProps = {
  editMode: boolean;
  projectId: string;
  documentId: string;
  conditionNumber: number;
  condition: ConditionModel;
  setCondition: React.Dispatch<React.SetStateAction<ConditionModel>>;
};

// Main component to render the condition and its subconditions
const ConditionDescription = ({
  editMode,
  projectId,
  documentId,
  conditionNumber,
  condition,
  setCondition
}: ConditionDescriptionProps) => {
  const [isEditing, setIsEditing] = useState(editMode);
  const [updatedCondition, setUpdatedCondition] = useState<ConditionModel | undefined>(condition);
  const [changedValues, setChangedValues] = useState<{ [key: string]: Partial<SubconditionModel> }>({});

  const onCreateFailure = () => {
    notify.error("Failed to save condition");
  };

  const onCreateSuccess = () => {
    notify.success("Condition saved successfully");
  };

  const { data: conditionDetails, mutate: updateConditionDetails } = useUpdateConditionDetails(
    projectId,
    documentId,
    conditionNumber,
    {
      onSuccess: onCreateSuccess,
      onError: onCreateFailure,
    }
  );

  useEffect(() => {
    if (conditionDetails) {
        setCondition((prevCondition) => ({
            ...prevCondition,
            ...conditionDetails,
        }));
    }
  }, [conditionDetails, setCondition]);

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

  const handleAddParentCondition = () => {
    if (!updatedCondition) return;

    const newCondition: SubconditionModel = {
      subcondition_id: `parent-${Date.now()}`,
      subcondition_identifier: '',
      subcondition_text: '',
      subconditions: [],
    };

    setUpdatedCondition({
      ...updatedCondition,
      subconditions: [...(updatedCondition.subconditions || []), newCondition],
    });
  };

  const handleDelete = (id: string) => {
    if (!updatedCondition) return;

    const deleteSubcondition = (subconds: SubconditionModel[]): SubconditionModel[] => {
      return subconds.filter(sub => sub.subcondition_id !== id).map(sub => ({
        ...sub,
        subconditions: sub.subconditions ? deleteSubcondition(sub.subconditions) : sub.subconditions,
      }));
    };

    setUpdatedCondition({
      ...updatedCondition,
      subconditions: deleteSubcondition(updatedCondition.subconditions || []),
    });
  };

  const handleAdd = (targetId: string) => {
    if (!updatedCondition) return;
  
    const addSubcondition = (subconds: SubconditionModel[] | undefined): SubconditionModel[] => {

      return (subconds || []).map((sub) => {
        if (sub.subcondition_id === targetId) {
          const newSubcondition: SubconditionModel = {
            subcondition_id: `${targetId}-${Date.now()}`,
            subcondition_identifier: '',
            subcondition_text: '',
            subconditions: [],
          };
  
          return {
            ...sub,
            subconditions: [...(sub.subconditions || []), newSubcondition],
          };
        }
  
        return {
          ...sub,
          subconditions: addSubcondition(sub.subconditions),
        };
      });
    };
  
    setUpdatedCondition((prev) => {
      if (!prev) return prev;
  
      return {
        ...prev,
        subconditions: addSubcondition(prev.subconditions),
      };
    });
  };   
  
  const saveChanges = () => {
    const data: updateTopicTagsModel = {
      subconditions: updatedCondition?.subconditions
    };
    updateConditionDetails(data);
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
            onDelete={handleDelete}
            onAdd={handleAdd}
            identifierValue={values.subcondition_identifier || ''}
            textValue={values.subcondition_text || ''}
          />
        );
      })}
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
              <AddIcon fontSize="small" /> Add Condition
            </Button>
          )}
        </Box>
        <Box width="50%" sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
      </Stack>
    </Box>
  );
};

export default ConditionDescription;
