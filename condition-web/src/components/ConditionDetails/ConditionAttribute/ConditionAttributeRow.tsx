import React, { useEffect, useState } from "react";
import { Button, IconButton, TableCell, TableRow, TableRowProps } from "@mui/material";
import { styled } from "@mui/system";
import EditIcon from "@mui/icons-material/Edit";
import { Save } from "@mui/icons-material";
import RemoveIcon from '@mui/icons-material/Remove';
import { BCDesignTokens } from "epic.theme";
import { ConditionAttributeModel } from "@/models/ConditionAttribute";
import { CONDITION_KEYS, SELECT_OPTIONS } from "./Constants";
import DynamicFieldRenderer from "./DynamicFieldRenderer";

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

  useEffect(() => {
    setEditableValue(conditionAttributeItem.value);
    if (conditionKey === CONDITION_KEYS.PARTIES_REQUIRED) {
      setChips(
        conditionAttributeItem.value
          ?.replace(/[{}]/g, "")
          .split(",")
          .map((item) => item.trim().replace(/^"|"$/g, ""))
      );
    }
  }, [conditionAttributeItem]);

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

    if (conditionKey === CONDITION_KEYS.PARTIES_REQUIRED) {
      const parsedChips = updatedValue
        .replace(/[{}]/g, "")
        .split(",")
        .map((item) => item.trim().replace(/^"|"$/g, ""))
        .filter((item) => item !== "");
      setChips(parsedChips);
    };
  };

  const renderEditableField = () => {
    const options = SELECT_OPTIONS[conditionKey];
    return (
      <DynamicFieldRenderer
        attributeKey={conditionKey}
        attributeValue={editableValue}
        setAttributeValue={setEditableValue}
        chips={chips}
        setChips={setChips}
        options={options}
      />
    );
  };

  const renderAttribute = () => {
    const options = SELECT_OPTIONS[conditionKey];
    if (options) {
      const selectedOption = options.find((option) => option.value === editableValue);
    
      return (
        <span
          style={{
            fontSize: "inherit",
            lineHeight: "inherit",
            width: "40%",
          }}
        >
          {selectedOption ? selectedOption.label : "N/A"}
        </span>
      );
    }
    
    if (conditionKey === CONDITION_KEYS.PARTIES_REQUIRED) {
      return (
        <ul style={{ margin: 0, paddingLeft: "16px" }}>
          {chips?.map((item, index) => (
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
