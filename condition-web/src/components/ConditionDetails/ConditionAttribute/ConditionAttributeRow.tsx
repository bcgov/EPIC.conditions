import React, { useState } from "react";
import {
  Box,
  Chip,
  TableCell,
  TableRow,
  TableRowProps,
  IconButton,
  TextField,
  Button,
  Select,
  MenuItem,
} from "@mui/material";
import { styled } from "@mui/system";
import EditIcon from "@mui/icons-material/Edit";
import { Save } from "@mui/icons-material";
import RemoveIcon from '@mui/icons-material/Remove';
import { BCDesignTokens } from "epic.theme";
import { ConditionAttributeModel } from "@/models/ConditionAttribute";
import { CONDITION_KEYS, SELECT_OPTIONS } from "./Constants";

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

export default ConditionAttributeRow;
