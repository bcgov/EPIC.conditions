import React, { memo, useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Chip,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableRowProps,
  Typography,
  IconButton,
  TextField,
  Button,
  Select,
  Stack,
  MenuItem,
} from "@mui/material";
import { styled } from "@mui/system";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from "@mui/icons-material/Edit";
import { Save } from "@mui/icons-material";
import RemoveIcon from '@mui/icons-material/Remove';
import { BCDesignTokens } from "epic.theme";
import { theme } from "@/styles/theme";
import { useUpdateConditionAttributeDetails } from "@/hooks/api/useConditionAttribute";
import { ConditionModel } from "@/models/Condition";
import { ConditionAttributeModel } from "@/models/ConditionAttribute";
import { CONDITION_KEYS, SELECT_OPTIONS } from "./Constants";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useUpdateConditionDetails } from "@/hooks/api/useConditions";
import { updateTopicTagsModel } from "@/models/Condition";
import { useGetAttributes } from "@/hooks/api/useAttributeKey";

type ConditionAttributeTableProps = {
  projectId: string;
  documentId: string;
  condition: ConditionModel;
  setCondition: React.Dispatch<React.SetStateAction<ConditionModel>>;
};

const ConditionAttribute = memo(({
  projectId,
  documentId,
  condition,
  setCondition
}: ConditionAttributeTableProps) => {

  const onCreateFailure = () => {
    notify.error("Failed to save condition attributes");
  };
  
  const onCreateSuccess = () => {
    notify.success("Condition attributes saved successfully");
  };

  const { data: conditionAttributeDetails, mutateAsync: updateAttributes } = useUpdateConditionAttributeDetails(
    condition.condition_id,
    {
      onSuccess: onCreateSuccess,
      onError: onCreateFailure,
    }
  );

  const onApproveFailure = () => {
      notify.error("Failed to approve condition attribute");
  };

  const onApproveSuccess = () => {
      notify.success("Condition attribute successfully approved");
  };

  const { data: conditionDetails, mutate: updateConditionDetails } = useUpdateConditionDetails(
      projectId,
      documentId,
      condition.condition_number,
      {
        onSuccess: onApproveSuccess,
        onError: onApproveFailure,
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

  const approveConditionAttributes = () => {
    const data: updateTopicTagsModel = {
      is_condition_attributes_approved: !condition.is_condition_attributes_approved }
    updateConditionDetails(data);
  };

  useEffect(() => {
    if (conditionAttributeDetails) {
        setCondition((prevCondition) => ({
            ...prevCondition,
            condition_attributes: conditionAttributeDetails,
        }));
    }
  }, [conditionAttributeDetails, setCondition]);
  
  const handleSave = async (updatedAttribute: ConditionAttributeModel) => {
    const updatedAttributes = condition.condition_attributes?.map((attr) =>
      attr.id === updatedAttribute.id ? updatedAttribute : attr
    ) || [];

    updateAttributes(updatedAttributes);

  };

  const handleAddConditionAttribute = () => {
    if (isAttributesLoading) {
      notify.info("Loading attributes, please wait...");
      return;
    }

    if (isAttributesError) {
      notify.error("Failed to load attributes");
      return;
    }

    setModalOpen(true);
  };

  const {
    data: attributesData,
    isPending: isAttributesLoading,
    isError: isAttributesError,
  } = useGetAttributes();

  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState("");

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedAttribute("");
  };

  const handleAttributeSelection = () => {
    if (!selectedAttribute) {
      notify.error("Please select an attribute before proceeding");
      return;
    }

    const newAttribute = {
      id: `(condition.condition_attributes?.length || 0) + 1-${Date.now()}`,
      key: selectedAttribute,
      value: "",
    };

    setCondition((prevCondition) => ({
      ...prevCondition,
      condition_attributes: [
        ...(prevCondition.condition_attributes || []),
        newAttribute,
      ],
    }));

    // Close the modal and reset the selection
    setModalOpen(false);
    setSelectedAttribute("");

    // Optional: Notify user of success
    notify.success("Condition attribute added successfully");
  };

  return (
    <Box>
      <TableContainer component={Box} sx={{ height: "100%", overflow: "hidden", borderRadius: "4px" }}>
        <Table sx={{ tableLayout: "fixed" }}>
          <TableHead
            sx={{
              ".MuiTableCell-root": {
                p: BCDesignTokens.layoutPaddingXsmall,
                backgroundColor: condition.is_condition_attributes_approved ? '#F7F9FC' : BCDesignTokens.themeGray30,
                marginBottom: `15px solid white`,
                fontSize: '14px',
                fontWeight: "bold",
              },
            }}
          >
            <TableRow>
              <TableCell align="left" sx={{ width: "30%", paddingLeft: "10px !important" }}>Condition</TableCell>
              <TableCell align="left" sx={{ width: "60%", paddingLeft: "10px !important" }}>Attribute</TableCell>
              <TableCell align="left" sx={{ width: "10%", paddingLeft: "10px !important" }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <Box sx={{ height: "5px", backgroundColor: BCDesignTokens.themeGray10 }} />

          <TableBody
            sx={{
              ".MuiTableCell-root": {
                p: BCDesignTokens.layoutPaddingXsmall,
                backgroundColor: condition.is_condition_attributes_approved ?'#F7F9FC' : BCDesignTokens.themeGray10,
                fontSize: '14px',
              },
            }}
          >
            {(condition.condition_attributes || []).map((attribute, index) => (
              <ConditionAttributeRow
                key={attribute.id}
                conditionAttributeItem={attribute}
                onSave={handleSave}
                is_approved={condition.is_condition_attributes_approved}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack sx={{ mt: 5 }} direction={"row"}>
        <Box width="50%" sx={{ display: 'flex', justifyContent: 'flex-start' }}>
          {!condition.is_condition_attributes_approved && (
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
              onClick={handleAddConditionAttribute}
            >
              <AddIcon fontSize="small" /> Add Condition Attribute
            </Button>
          )}
        </Box>

        <Modal
          open={isModalOpen}
          onClose={handleCloseModal}
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              borderRadius: "8px",
            }}
          >
            <Typography id="modal-title" variant="h6" component="h2" gutterBottom>
              Select an Attribute
            </Typography>

            {isAttributesLoading ? (
              <CircularProgress size={24} sx={{ display: "block", margin: "16px auto" }} />
            ) : (
              <Select
                value={selectedAttribute}
                onChange={(e) => setSelectedAttribute(e.target.value)}
                fullWidth
                displayEmpty
                sx={{ mb: 2 }}
              >
                <MenuItem value="" disabled>
                  Select an attribute
                </MenuItem>
                {attributesData?.map((attribute: any) => (
                  <MenuItem key={attribute.id} value={attribute.key_name}>
                    {attribute.key_name}
                  </MenuItem>
                ))}
              </Select>
            )}
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
              <Button variant="outlined" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleAttributeSelection} disabled={!selectedAttribute}>
                Confirm
              </Button>
            </Box>
          </Box>
        </Modal>
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
            onClick={approveConditionAttributes}
        >
          {condition.is_condition_attributes_approved ?
          'Un-approve Condition Attributes' : 'Approve Condition Attributes'}
        </Button>
        </Box>
      </Stack>
    </Box>
  );
});

const StyledTableRow = styled(TableRow)(() => ({}));

type StyledTableRowProps = TableRowProps & { error?: boolean };

export const PackageTableRow = ({
  error,
  children,
  ...otherProps
}: StyledTableRowProps) => {
  const childrenWithProps = React.Children.map(children, (child) =>
    React.isValidElement(child)
      ? React.cloneElement(child, { error } as any)
      : child
  );

  return <StyledTableRow {...otherProps}>{childrenWithProps}</StyledTableRow>;
};

export const ConditionAttributeHeadTableCell = styled(TableCell)(() => ({
  border: `1px solid ${BCDesignTokens.themeGray30}`,
  paddingLeft: "10px !important",
}));

type ConditionAttributeRowProps = {
  conditionAttributeItem: ConditionAttributeModel;
  onSave: (updatedAttribute: ConditionAttributeModel) => void;
  is_approved: boolean;
};

const ConditionAttributeRow: React.FC<ConditionAttributeRowProps> = ({
  conditionAttributeItem,
  onSave,
  is_approved
}) => {
  const { key: conditionKey, value: attributeValue } = conditionAttributeItem;
  const [isEditable, setIsEditable] = useState(false);
  const [editableValue, setEditableValue] = useState(attributeValue);

  const [chips, setChips] = useState<string[]>(
    conditionKey === CONDITION_KEYS.PARTIES_REQUIRED
      ? attributeValue
          ?.replace(/[{}]/g, "")
          .split(",")
          .map((item) => item.trim().replace(/^"|"$/g, ""))
      : []
  );
  const [chipInput, setChipInput] = useState("");

  const handleSave = () => {
    setIsEditable(false);

    const updatedValue =
    conditionKey === CONDITION_KEYS.PARTIES_REQUIRED
      ? `{${chips
        .filter((chip) => chip !== null && chip !== "")
        .map((chip) => `"${chip}"`)
        .join(",")}}`
      : editableValue;

    onSave({ ...conditionAttributeItem, value: updatedValue });
  };

  const handleAddChip = () => {
    if (chipInput.trim() && !chips.includes(chipInput)) {
      setChips([...chips, chipInput]);
      setChipInput("");
    }
  };

  const handleDeleteChip = (chipToDelete: string) => {
    setChips(chips.filter((chip) => chip !== chipToDelete));
  };

  const renderEditableField = () => {
    const options = SELECT_OPTIONS[conditionKey];
    if (options) {
      return (
        <Select
          value={editableValue}
          onChange={(e) => setEditableValue(e.target.value)}
          fullWidth
          sx={{
            fontSize: "inherit",
            lineHeight: "inherit",
            width: "40%",
            "& .MuiSelect-select": {
              padding: "8px",
            },
          }}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      );
    }

    if (conditionKey === CONDITION_KEYS.PARTIES_REQUIRED) {
      return (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center",
            width: "100%",
          }}
        >
          {chips
            .filter((chip) => chip !== null && chip !== "")
            .map((chip, index) => (
              <Chip
                key={index}
                label={chip}
                onDelete={() => handleDeleteChip(chip)}
                sx={{
                  marginLeft: 1,
                  backgroundColor: BCDesignTokens.themeGray30,
                  color: "black",
                  fontSize: "14px"
                }}
              />
          ))}
          <TextField
            value={chipInput}
            onChange={(e) => setChipInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddChip();
              }
            }}
            placeholder="Add a party"
            size="small"
            sx={{ marginLeft: 1, paddingTop: 3, width: "auto", flexShrink: 0 }}
          />
        </Box>
      );
    }

    return (
      <TextField
        value={editableValue}
        onChange={(e) => setEditableValue(e.target.value)}
        fullWidth
        sx={{
          "& .MuiInputBase-root": {
            padding: "0 8px",
            fontSize: "inherit",
            lineHeight: "inherit",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            border: "none",
          },
          height: "1.5em",
        }}
      />
    );
  };

  const renderAttribute = () => {
    const options = SELECT_OPTIONS[conditionKey];
    if (options) {
      const selectedOption = options.find((option) => option.value === editableValue);
    
      return (
        <div
          style={{
            fontSize: "inherit",
            lineHeight: "inherit",
            width: "40%",
          }}
        >
          {selectedOption ? selectedOption.label : "N/A"}
        </div>
      );
    }
    
    if (conditionKey === CONDITION_KEYS.PARTIES_REQUIRED) {
      const parsedItems = attributeValue
        .replace(/[{}]/g, "")
        .split(",")
        .map((item: string) => item.trim().replace(/^"|"$/g, ""))
        .filter((item: string) => item !== "");

      return (
        <ul style={{ margin: 0, paddingLeft: "16px" }}>
          {parsedItems?.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    }

    return attributeValue;
  };

  return (
    <PackageTableRow>
      <ConditionAttributeHeadTableCell align="left">{conditionKey}</ConditionAttributeHeadTableCell>
      <ConditionAttributeHeadTableCell align="left">
        {isEditable ? renderEditableField() : renderAttribute()}
      </ConditionAttributeHeadTableCell>
      <ConditionAttributeHeadTableCell
        align="left"
        sx={{
          "&:hover": is_approved
            ? {}
            : {
                backgroundColor: BCDesignTokens.themeGray70,
              },
        }}
      >
        {is_approved ? (
          <IconButton size="small" disabled sx={{ cursor: "default" }}>
            <RemoveIcon />
          </IconButton>
        ) : (
          isEditable ? (
            <Button
              variant="contained"
              color="secondary"
              size="small"
              sx={{
                borderRadius: "4px",
                color: BCDesignTokens.themeGray100,
              }}
              onClick={handleSave}
            >
              <Save fontSize="small" sx={{ mr: 0.4 }}/>
              Save
            </Button>
          ) : (
            <IconButton size="small" onClick={() => setIsEditable(true)}>
              <EditIcon />
            </IconButton>
          )
        )}
      </ConditionAttributeHeadTableCell>
    </PackageTableRow>
  );
};

export default ConditionAttribute;
