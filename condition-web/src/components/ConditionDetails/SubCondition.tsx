import { Box, IconButton, Typography, TextField } from "@mui/material";
import { SubconditionModel } from "@/models/Subcondition";
import { theme } from "@/styles/theme";
import AddIcon from '@mui/icons-material/Add';
import Delete from "@mui/icons-material/Delete";
import { BCDesignTokens } from "epic.theme";
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const SubconditionComponent: React.FC<{
  subcondition: SubconditionModel;
  indentLevel: number;
  isEditing: boolean;
  onEdit: (id: string, newIdentifier: string, newText: string) => void;
  onDelete: (id: string) => void;
  onAdd: (parentId: string) => void;
  identifierValue: string;
  textValue: string;
  is_approved: boolean;
  dragHandleRef?: (element: HTMLElement | null) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  hasChildren?: boolean;
  collapsed?: boolean;
  onCollapse?: () => void;
}> = ({
  subcondition,
  indentLevel,
  isEditing,
  onEdit,
  onDelete,
  onAdd,
  identifierValue,
  textValue,
  is_approved,
  dragHandleRef,
  dragHandleProps,
  hasChildren,
  collapsed,
  onCollapse,
}) => {

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
            <Box
              ref={dragHandleRef}
              {...dragHandleProps}
              sx={{
                cursor: 'grab',
                paddingRight: '4px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
                '&:hover': {
                  backgroundColor: '#e2e8f0'
                }
              }}
            >
              <DragIndicatorIcon fontSize="small" color="disabled" />
            </Box>
          )}
          {hasChildren && (
            <IconButton size="small" onClick={onCollapse} sx={{ ml: -1, mr: 0.5 }}>
              {collapsed ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
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
      </>
    );
  };

export default SubconditionComponent;
