import { Box, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import { SubconditionModel } from "@/models/Subcondition";
import { theme } from "@/styles/theme";
import AddIcon from '@mui/icons-material/Add';
import Delete from "@mui/icons-material/Delete";
import { BCDesignTokens } from "epic.theme";
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Droppable, Draggable } from '@hello-pangea/dnd';

const SubconditionComponent: React.FC<{
  subcondition: SubconditionModel;
  index: number;
  indentLevel: number;
  isEditing: boolean;
  onEdit: (id: string, newIdentifier: string, newText: string) => void;
  onDelete: (id: string) => void;
  onAdd: (parentId: string) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
  activeDroppableId: string | null;
  identifierValue: string;
  textValue: string;
  is_approved: boolean;
}> = ({
  subcondition,
  index,
  indentLevel,
  isEditing,
  onEdit,
  onDelete,
  onAdd,
  onIndent,
  onOutdent,
  activeDroppableId,
  identifierValue,
  textValue,
  is_approved,
}) => {

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEdit(subcondition.subcondition_id, e.target.value ?? '', textValue);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEdit(subcondition.subcondition_id, identifierValue, e.target.value ?? '');
  };

  return (
    <Draggable
      draggableId={subcondition.subcondition_id}
      index={index}
      isDragDisabled={!isEditing}
    >
      {(dragProvided) => (
        <div
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
          style={{ ...dragProvided.draggableProps.style }}
        >
          <Box
            sx={{
              padding: '8px 12px',
              backgroundColor: is_approved ? '#F7F9FC' : BCDesignTokens.themeGray10,
              borderRadius: '3px',
              border: `1px solid ${theme.palette.primary.light}`,
              marginBottom: '10px',
              marginLeft: indentLevel > 1 ? `${indentLevel * 20}px` : '0px',
              display: 'flex',
              gap: '8px'
            }}
          >
            {isEditing && (
              <div
                {...dragProvided.dragHandleProps}
                style={{ cursor: 'grab', paddingRight: 4 }}
              >
                <DragIndicatorIcon fontSize="small" />
              </div>
            )}
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
                  {indentLevel > 1 && (
                    <Tooltip title="Outdent">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onOutdent(subcondition.subcondition_id)}
                          aria-label="Outdent"
                          sx={{
                            borderRadius: "4px",
                            "&:hover": {
                              backgroundColor: theme.palette.action.hover,
                            },
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "1rem", lineHeight: 1 }}>
                            ⟵
                          </Typography>
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                  {index > 0 && (
                    <Tooltip title="Indent">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onIndent(subcondition.subcondition_id)}
                          aria-label="Indent"
                          sx={{
                            borderRadius: "4px",
                            "&:hover": {
                              backgroundColor: theme.palette.action.hover,
                            },
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "1rem", lineHeight: 1 }}>
                            ⟶
                          </Typography>
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
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
                {subcondition.subcondition_identifier && (
                  <span style={{ color: theme.palette.primary.dark, marginRight: '8px' }}>
                    {subcondition.subcondition_identifier.endsWith(')')
                      ? subcondition.subcondition_identifier
                      : `${subcondition.subcondition_identifier})`}
                  </span>
                )}
                {subcondition.subcondition_text}
              </Typography>
            )}
          </Box>

          <Droppable
            droppableId={subcondition.subcondition_id}
            type="SUBCONDITION"
            isDropDisabled={
              activeDroppableId !== null && activeDroppableId !== subcondition.subcondition_id
            }
          >
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {subcondition.subconditions?.map((nestedSub, nestedIndex) => (
                  <SubconditionComponent
                    key={nestedSub.subcondition_id}
                    subcondition={nestedSub}
                    index={nestedIndex}
                    indentLevel={indentLevel + 1}
                    isEditing={isEditing}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAdd={onAdd}
                    onIndent={onIndent}
                    onOutdent={onOutdent}
                    activeDroppableId={activeDroppableId}
                    identifierValue={nestedSub.subcondition_identifier}
                    textValue={nestedSub.subcondition_text}
                    is_approved={is_approved}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      )}
    </Draggable>
  );
};

export default SubconditionComponent;
