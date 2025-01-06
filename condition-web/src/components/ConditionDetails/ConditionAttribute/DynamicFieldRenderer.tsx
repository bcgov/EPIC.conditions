import React, { useEffect, useState } from "react";
import {
    Checkbox,
    IconButton,
    InputAdornment,
    ListItemText,
    MenuItem,
    Select,
    TextField,
    Typography
} from "@mui/material";
import { CONDITION_KEYS, SELECT_OPTIONS, TIME_UNITS, TIME_VALUES } from "./Constants";
import ChipInput from "../../Shared/Chips/ChipInput";
import AddIcon from '@mui/icons-material/Add';

type DynamicFieldRendererProps = {
  attributeKey: string;
  attributeValue: string;
  setAttributeValue: (value: string) => void;
  chips: string[];
  setChips: (value: string[]) => void;
  milestones: string[];
  setMilestones: (value: string[]) => void;
  otherValue: string;
  setOtherValue: (value: string) => void;
  options?: { label: string; value: string }[];
};

const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  attributeKey,
  attributeValue,
  setAttributeValue,
  chips,
  setChips,
  milestones,
  setMilestones,
  otherValue,
  setOtherValue,
  options,
}) => {

    const [timeUnit, setTimeUnit] = useState<string>("");
    const [timeValue, setTimeValue] = useState<string>("");
    const [customTimeValue, setCustomTimeValue] = useState<string>("");
    const [error, setError] = useState(false);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customMilestone, setCustomMilestone] = useState("");
   
    useEffect(() => {
        if (timeUnit) {
            const value = customTimeValue || timeValue;
            if (value) {
                setAttributeValue(`${value} ${timeUnit}`);
            }
        }
    }, [timeValue, timeUnit, customTimeValue, setAttributeValue]);

    if (attributeKey === CONDITION_KEYS.TIME_ASSOCIATED_WITH_SUBMISSION_MILESTONE) {
        return (
            <>
                <Select
                    value={timeUnit}
                    onChange={(e) => setTimeUnit(e.target.value)}
                    displayEmpty
                    fullWidth
                    sx={{ marginBottom: "16px" }}
                >
                    <MenuItem value="" disabled>
                        Select Time Unit
                    </MenuItem>
                    {TIME_UNITS.map((option) => (
                        <MenuItem key={option.value} value={option.label}>
                            {option.label}
                        </MenuItem>
                    ))}
                </Select>
      
                <Select
                    value={timeValue}
                    onChange={(e) => setTimeValue(e.target.value)}
                    displayEmpty
                    fullWidth
                    disabled={!timeUnit}
                    sx={{ marginBottom: "16px" }}
                >
                    <MenuItem value="" disabled>
                        Select Time Value
                    </MenuItem>
                    {timeUnit && TIME_VALUES[timeUnit as keyof typeof TIME_VALUES].map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </Select>
      
                {timeValue === "Other" ? (
                    <TextField
                        value={customTimeValue}
                        onChange={(e) => setCustomTimeValue(e.target.value)}
                        placeholder="Please specify"
                        fullWidth
                        sx={{ marginTop: "8px" }}
                    />
                ) : null}
            </>
        );
    }

    if (attributeKey === CONDITION_KEYS.PARTIES_REQUIRED) {
        return (
            <ChipInput
                chips={chips}
                setChips={setChips}
                placeholder="Add a party"
                inputWidth="30%"
            />
        );
    }

    if (attributeKey === CONDITION_KEYS.MILESTONES_RELATED_TO_PLAN_IMPLEMENTATION) {
        const milestoneOptions = SELECT_OPTIONS[CONDITION_KEYS.MILESTONE_RELATED_TO_PLAN_SUBMISSION];
    
        const handleAddCustomMilestone = () => {
            if (customMilestone.trim()) {
              setMilestones([...milestones, customMilestone]);
              setCustomMilestone(""); // Clear the input field
              setShowCustomInput(false); // Hide the custom input field
            }
        };

        return (
          <>
            <Select
                    multiple // Enables multiple selection
                    value={Array.isArray(milestones) ? milestones : []}
                    onChange={(e) => setMilestones(e.target.value as string[])} // Handle multiple values
                    renderValue={(selected) => (selected as string[]).join(", ")} // Display selected values as comma-separated text
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
                {milestoneOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        <Checkbox checked={Array.isArray(milestones) && milestones.includes(option.value)} />
                        <ListItemText primary={option.label} />
                    </MenuItem>
                ))}
            </Select>

            <Typography
                variant="body2"
                color="primary"
                onClick={() => setShowCustomInput(true)}
                sx={{
                marginTop: "8px",
                cursor: "pointer",
                textDecoration: "underline",
                }}
            >
                + Other Milestone
            </Typography>

            {showCustomInput && (
                <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <TextField
                        value={customMilestone}
                        onChange={(e) => setCustomMilestone(e.target.value)}
                        placeholder="Enter custom milestone"
                        size="small"
                        fullWidth
                        sx={{
                            flex: 1,
                        }}
                        InputProps={{
                            endAdornment: customMilestone ? (
                              <InputAdornment position="end" sx={{ marginRight: "-5px" }}>
                                <IconButton
                                  onClick={handleAddCustomMilestone}
                                  sx={{
                                    padding: 0,
                                    borderRadius: "50%",
                                    backgroundColor: "green",
                                    color: "white",
                                    "&:hover": { backgroundColor: "darkgreen" },
                                  }}
                                >
                                  <AddIcon
                                    sx={{
                                        fontSize: "20px",
                                    }}
                                  />
                                </IconButton>
                              </InputAdornment>
                            ) : null,
                        }}
                    />
                </div>
            )}
          </>
        );
    }

    if (options) {
        return (
            <>
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
                {attributeValue === "Other" && (
                    <TextField
                        value={otherValue}
                        onChange={(e) => {
                            const value = e.target.value;
                            setOtherValue(value);
                            setError(value.trim() === "");
                        }}
                        onBlur={() => {
                            if (!otherValue.trim()) {
                                setError(true);
                            }
                        }}
                        placeholder="Please specify"
                        fullWidth
                        error={error}
                        sx={{
                        marginTop: "8px",
                        "& .MuiInputBase-root": {
                            padding: "0 0px",
                            fontSize: "inherit",
                            lineHeight: "inherit",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                            border: error ? "1px solid red" : "none",
                        },
                        height: "1.5em",
                        }}
                    />
                )}
            </>
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
