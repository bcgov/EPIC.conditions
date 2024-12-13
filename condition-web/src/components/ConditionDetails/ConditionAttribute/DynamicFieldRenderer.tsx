import React from "react";
import { MenuItem, Select, TextField } from "@mui/material";
import { CONDITION_KEYS } from "./Constants";
import ChipInput from "../../Shared/Chips/ChipInput";

type DynamicFieldRendererProps = {
  attributeKey: string;
  attributeValue: string;
  setAttributeValue: (value: string) => void;
  chips: string[];
  setChips: (value: string[]) => void;
  options?: { label: string; value: string }[];
};

const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  attributeKey,
  attributeValue,
  setAttributeValue,
  chips,
  setChips,
  options,
}) => {
    if (attributeKey === CONDITION_KEYS.PARTIES_REQUIRED) {
        return (
            <ChipInput
                chips={chips}
                setChips={setChips}
                placeholder="Add a party"
            />
        );
    }

    if (options) {
        return (
        <Select
            value={attributeValue}
            onChange={(e) => setAttributeValue(e.target.value)}
            fullWidth
            sx={{
                fontSize: "inherit",
                lineHeight: "inherit",
                width: "100%",
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

    return (
        <TextField
            value={attributeValue}
            onChange={(e) => setAttributeValue(e.target.value)}
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

export default DynamicFieldRenderer;
