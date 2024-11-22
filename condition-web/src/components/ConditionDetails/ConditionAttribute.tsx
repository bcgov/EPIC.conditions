import React, { memo, useEffect, useState } from "react";
import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
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
import { BCDesignTokens } from "epic.theme";
import { useUpdateConditionAttributeDetails } from "@/hooks/api/useConditionAttribute";
import { ConditionModel } from "@/models/Condition";
import { ConditionAttributeModel } from "@/models/ConditionAttribute";
import { CONDITION_KEYS, SELECT_OPTIONS } from "./Constants";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";

type ConditionAttributeTableProps = {
  condition: ConditionModel;
  setCondition: React.Dispatch<React.SetStateAction<ConditionModel>>;
};

const ConditionAttribute = memo(({ condition, setCondition }: ConditionAttributeTableProps) => {

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

  return (
    <TableContainer component={Box} sx={{ height: "100%", overflow: "hidden", borderRadius: "4px" }}>
      <Table sx={{ tableLayout: "fixed" }}>
        <TableHead
          sx={{
            ".MuiTableCell-root": {
              p: BCDesignTokens.layoutPaddingXsmall,
              backgroundColor: BCDesignTokens.themeGray30,
              marginBottom: `15px solid white`,
              fontSize: '14px',
              fontWeight: "bold",
              "&:hover": {
                backgroundColor: BCDesignTokens.themeGray70,
              },
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
              backgroundColor: BCDesignTokens.themeGray10,
              fontSize: '14px',
              "&:hover": {
                backgroundColor: BCDesignTokens.themeGray70,
              },
            },
          }}
        >
          {condition?.condition_attributes?.map((attribute, index) => (
            <ConditionAttributeRow
              key={attribute.id}
              conditionAttributeItem={attribute}
              onSave={handleSave}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
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
};

const ConditionAttributeRow: React.FC<ConditionAttributeRowProps> = ({ conditionAttributeItem, onSave }) => {
  const { id, key: conditionKey, value: attributeValue } = conditionAttributeItem;
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
      ? `{${chips.map((chip) => `"${chip}"`).join(",")}}`
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
          {chips.map((chip, index) => (
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
        .map((item: string) => item.trim().replace(/^"|"$/g, ""));

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
      <ConditionAttributeHeadTableCell align="left">
        {isEditable ? (
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
            Save
          </Button>
        ) : (
          <IconButton size="small" onClick={() => setIsEditable(true)}>
            <EditIcon />
          </IconButton>
        )}
      </ConditionAttributeHeadTableCell>
    </PackageTableRow>
  );
};

export default ConditionAttribute;
