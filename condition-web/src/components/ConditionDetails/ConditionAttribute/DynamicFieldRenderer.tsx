import React, { useEffect, useRef, useState } from "react";
import {
    Box,
    Checkbox,
    IconButton,
    InputAdornment,
    ListItemText,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
    Chip
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import { CONDITION_KEYS, SELECT_OPTIONS, TIME_UNITS, TIME_VALUES } from "./Constants";
import ChipInput from "../../Shared/Chips/ChipInput";
import AddIcon from '@mui/icons-material/Add';
import { createTheme, ThemeProvider } from "@mui/material/styles";

type DynamicFieldRendererProps = {
    editMode: boolean;
    attributeData: {
      key: string;
      value: string;
      setValue: (value: string) => void;
    };
    chipsData: {
      chips: string[];
      setChips: (value: string[]) => void;
    };
    milestonesData: {
      milestones: string[];
      setMilestones: (value: string[]) => void;
    };
    planNamesData: {
        planNames: string[];
        setPlanNames: (value: string[]) => void;
    };
    otherData: {
        otherValue: string;
        setOtherValue: (value: string) => void;
    };
    options?: { label: string; value: string }[];
  };

const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
    editMode,
    options,
    attributeData,
    chipsData,
    milestonesData,
    planNamesData,
    otherData,
}) => {
    const [timeUnit, setTimeUnit] = useState<string>("");
    const [timeValue, setTimeValue] = useState<string>("");
    const [timeDirection, setTimeDirection] = useState("");
    const [customTimeValue, setCustomTimeValue] = useState<string>("");
    const [error, setError] = useState(false);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [showCustomPlanNames, setShowCustomPlanNames] = useState(false);
    const [customMilestone, setCustomMilestone] = useState("");
    const [additionalPlanNames, setAdditionalPlanNames] = useState("");
    const [dynamicWidth, setDynamicWidth] = useState<number>(100);
    const textRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (textRef.current) {
            const totalLength = milestonesData.milestones.join(", ");
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (context) {
                const textWidth = context.measureText(totalLength).width;
                setDynamicWidth(Math.max(textWidth + 180, 200));
            }
        }
    }, [milestonesData]);

    const theme = createTheme({
        typography: {
            fontFamily: 'BC Sans',
        },
        components: {
          MuiSelect: {
            styleOverrides: {
              root: {
                "&.Mui-disabled": {
                  backgroundColor: "#EDEBE9",
                },
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              input: {
                "&.Mui-disabled": {
                  color: "#9F9D9C !important",
                },
              },
            },
          },
        },
    });

    useEffect(() => {
        if (timeUnit) {
            if (timeUnit === "N/A") {
                attributeData.setValue(timeUnit); // Only set the time unit
            } else {
                const value = customTimeValue || timeValue;
                if (value) {
                    attributeData.setValue(`${value} ${timeUnit} ${timeDirection}`);
                }
            }
        }
    }, [timeValue, timeUnit, timeDirection, customTimeValue, attributeData]);    

    const handleTimeUnitChange = (e: SelectChangeEvent<string>) => {
        const selectedUnit = e.target.value;
        setTimeUnit(selectedUnit);
    
        // If 'N/A' is selected, set timeValue to 'na', otherwise reset it
        if (selectedUnit === "N/A") {
            setTimeValue("na");
        } else {
            setTimeValue("");
        }
    };

    if (attributeData.key === CONDITION_KEYS.TIME_ASSOCIATED_WITH_SUBMISSION_MILESTONE) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <Select
                    value={timeUnit}
                    onChange={handleTimeUnitChange}
                    displayEmpty
                    fullWidth
                    sx={{
                        fontSize: "inherit",
                        lineHeight: "inherit",
                        width: editMode ? "30%" : "100%",
                        "& .MuiSelect-select": {
                            padding: "8px",
                        },
                        marginBottom: "10px",
                    }}
                >
                    <MenuItem value="" disabled sx={{ fontFamily: 'BC Sans' }}>
                        Select Time Unit
                    </MenuItem>
                    {TIME_UNITS.map((option) => (
                        <MenuItem key={option.value} value={option.label}>
                            {option.label}
                        </MenuItem>
                    ))}
                </Select>
                <ThemeProvider theme={theme}>
                    <Select
                        value={timeValue}
                        onChange={(e) => setTimeValue(e.target.value)}
                        displayEmpty
                        fullWidth
                        disabled={!timeUnit || timeUnit === "N/A"} 
                        sx={{
                            fontSize: "inherit",
                            lineHeight: "inherit",
                            width: editMode ? "30%" : "100%",
                            "& .MuiSelect-select": {
                                padding: "8px",
                            },
                            marginBottom: "10px",
                        }}
                    >
                        <MenuItem value="" disabled sx={{ fontFamily: 'BC Sans' }}>
                            Select Time Value
                        </MenuItem>
                        {timeUnit === "N/A" ? (
                            <MenuItem key="na" value="na">
                                N/A
                            </MenuItem>
                        ) : (
                            TIME_VALUES[timeUnit as keyof typeof TIME_VALUES]?.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))
                        )}
                    </Select>
                </ThemeProvider>
                <ThemeProvider theme={theme}>
                    <Select
                        value={timeDirection}
                        onChange={(e) => setTimeDirection(e.target.value)}
                        displayEmpty
                        fullWidth
                        disabled={!timeUnit || timeUnit === "N/A"}
                        sx={{
                            fontSize: "inherit",
                            lineHeight: "inherit",
                            width: editMode ? "30%" : "100%",
                            "& .MuiSelect-select": {
                            padding: "8px",
                            },
                            marginBottom: "10px",
                        }}
                        >
                        <MenuItem value="" disabled sx={{ fontFamily: 'BC Sans' }}>
                            Select Direction
                        </MenuItem>
                        <MenuItem value="Before">Before</MenuItem>
                        <MenuItem value="After">After</MenuItem>
                    </Select>
                </ThemeProvider>
                {timeValue === "Other" ? (
                    <TextField
                        value={customTimeValue}
                        onChange={(e) => setCustomTimeValue(e.target.value)}
                        placeholder="Please specify"
                        size="small"
                        fullWidth
                        sx={{
                            flex: "0 0 auto",
                            width: editMode ? "30%" : "100%",
                        }}
                    />
                ) : null}
            </Box>
        );
    }

    if (attributeData.key === CONDITION_KEYS.PARTIES_REQUIRED) {
        return (
            <ChipInput
                chips={chipsData.chips}
                setChips={chipsData.setChips}
                placeholder="Add a party"
                inputWidth={editMode ? "30%" : "100%"}
            />
        );
    }

    if (attributeData.key === CONDITION_KEYS.MILESTONES_RELATED_TO_PLAN_IMPLEMENTATION) {
        const milestoneOptions = SELECT_OPTIONS[CONDITION_KEYS.MILESTONES_RELATED_TO_PLAN_IMPLEMENTATION];
    
        const handleAddCustomMilestone = () => {
            if (customMilestone.trim()) {
              milestonesData.setMilestones([...milestonesData.milestones, customMilestone]);
              setCustomMilestone(""); // Clear the input field
              setShowCustomInput(false); // Hide the custom input field
            }
        };

        return (
          <>
            <Select
                multiple // Enables multiple selection
                value={Array.isArray(milestonesData.milestones) ? milestonesData.milestones : []}
                onChange={(e) => milestonesData.setMilestones(e.target.value as string[])} // Handle multiple values
                renderValue={(selected) => (
                    <Box ref={textRef}>
                        {(selected as string[]).join(", ")}
                    </Box>
                )}
                fullWidth
                sx={{
                    fontSize: "inherit",
                    lineHeight: "inherit",
                    width: editMode ? `${dynamicWidth}px` : "100%",
                    minWidth: "30%",
                    "& .MuiSelect-select": {
                        padding: "8px",
                    },
                    marginBottom: "10px",
                }}
            >
                {milestoneOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        <Checkbox
                            checked={
                                Array.isArray(milestonesData.milestones) &&
                                milestonesData.milestones.includes(option.value)
                            }
                        />
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
                            flex: "0 0 auto",
                            width: editMode ? "30%" : "100%",
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

    if (attributeData.key === CONDITION_KEYS.MANAGEMENT_PLAN_NAME) {
        const handleAddAdditionalPlanNames = () => {
            if (additionalPlanNames.trim()) {
                planNamesData.setPlanNames([...planNamesData.planNames, additionalPlanNames]);
                setAdditionalPlanNames(""); // Clear the input field
                setShowCustomPlanNames(false); // Hide the custom input field
            }
        };
    
        const handleDeleteChip = (chipToDelete: string) => {
            setShowCustomPlanNames(false);
            planNamesData.setPlanNames(
                planNamesData.planNames.filter((chip) => chip !== chipToDelete)
            );
        };
    
        const shouldRenderChipInput =
        planNamesData.planNames.length === 0 ||
        (planNamesData.planNames.length === 1 && planNamesData.planNames[0] === "");

        return (
            <>
                {shouldRenderChipInput ? (
                    // Render the ChipInput component if no plan names exist
                    <ChipInput
                        chips={planNamesData.planNames}
                        setChips={(newChips) => planNamesData.setPlanNames(newChips)}
                        placeholder="Add a management plan name"
                        inputWidth={editMode ? "30%" : "100%"}
                    />
                ) : (
                    // Render chips if there are plan names
                    <div>
                        {/* Chips displayed in a flexible row */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                            {planNamesData.planNames
                            .filter((chip) => chip.trim() !== "")
                            .map((name, index) => (
                                <Chip
                                    key={index}
                                    label={name}
                                    onDelete={() => handleDeleteChip(name)}
                                    sx={{
                                        backgroundColor: "#e0e0e0",
                                        color: "black",
                                        fontSize: "14px",
                                    }}
                                />
                            ))}
                        </div>
    
                        {/* "+ Add name for another Management Plan" appears on the next line */}
                        <div>
                            <Typography
                                variant="body2"
                                color="primary"
                                onClick={() => setShowCustomPlanNames(true)}
                                sx={{
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                }}
                            >
                                + Add name for another Management Plan
                            </Typography>
                        </div>
                    </div>
                )}
    
                {showCustomPlanNames && (
                    <div
                        style={{
                            marginTop: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <TextField
                            value={additionalPlanNames}
                            onChange={(e) => setAdditionalPlanNames(e.target.value)}
                            placeholder="Add a management plan name"
                            size="small"
                            fullWidth
                            sx={{
                                flex: "0 0 auto",
                                width: editMode ? "30%" : "100%",
                            }}
                            InputProps={{
                                endAdornment: additionalPlanNames ? (
                                    <InputAdornment
                                        position="end"
                                        sx={{ marginRight: "-5px" }}
                                    >
                                        <IconButton
                                            onClick={handleAddAdditionalPlanNames}
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
            <Stack direction="column">
                <Select
                    value={attributeData.value}
                    onChange={(e) => attributeData.setValue(e.target.value)}
                    fullWidth
                    sx={{
                        fontSize: "inherit",
                        lineHeight: "inherit",
                        width: editMode ? "30%" : "100%",
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
                {attributeData.value === "Other" && (
                    <TextField
                        value={otherData.otherValue}
                        onChange={(e) => {
                            const value = e.target.value;
                            otherData.setOtherValue(value);
                            setError(value.trim() === "");
                        }}
                        size="small"
                        onBlur={() => {
                            if (!otherData.otherValue.trim()) {
                                setError(true);
                            }
                        }}
                        placeholder="Please specify"
                        fullWidth
                        error={error}
                        sx={{
                            width: editMode ? "30%" : "100%",
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
            </Stack>
        );
    }

    return (
        <TextField
            value={attributeData.value || ""}
            onChange={(e) => attributeData.setValue(e.target.value)}
            fullWidth
            size="small"
            placeholder="Please specify"
            sx={{
                flex: "0 0 auto",
                width: editMode ? "30%" : "100%",
                "& .MuiInputBase-root": {
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
