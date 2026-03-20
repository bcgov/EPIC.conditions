import React, { useState } from "react";
import { Box, Chip, IconButton, InputAdornment, TextField } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';

type ChipInputProps = {
  chips: string[];
  setChips: (chips: string[]) => void;
  placeholder?: string;
  inputWidth?: string;
  chipInput?: string;
  setChipInput?: (value: string) => void;
};

const ChipInput: React.FC<ChipInputProps> = ({
  chips = [],
  setChips,
  placeholder = "Add a chip",
  inputWidth = "100%",
  chipInput: externalChipInput,
  setChipInput: externalSetChipInput,
}) => {
  const [internalChipInput, setInternalChipInput] = useState("");
  const chipInput = externalChipInput !== undefined ? externalChipInput : internalChipInput;
  const setChipInput = externalSetChipInput ?? setInternalChipInput;

  const handleAddChip = () => {
    if (chipInput.trim() && !chips.includes(chipInput)) {
      setChips([...chips, chipInput]);
      setChipInput("");
    }
  };

  const handleRemoveChip = (index: number) => {
    setChips(chips.filter((_, chipIndex) => chipIndex !== index));
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        alignItems: "center",
        width: inputWidth,
      }}
    >
      {chips
        .filter((chip) => chip.trim() !== "") // Filter out empty strings
        .map((chip, index) => (
          <Chip
            key={index}
            label={chip}
            onDelete={() => handleRemoveChip(index)}
            sx={{
              backgroundColor: "#e0e0e0",
              color: "black",
              fontSize: "14px",
            }}
          />
        ))}
      <TextField
        placeholder={placeholder}
        value={chipInput}
        size="small"
        onChange={(e) => setChipInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && chipInput.trim() !== "") {
            handleAddChip();
            e.preventDefault();
          }
        }}
        fullWidth
        InputProps={{
          endAdornment: chipInput ? (
            <InputAdornment position="end" sx={{ marginRight: "-5px" }}>
              <IconButton
                onClick={handleAddChip}
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
    </Box>
  );
};

export default ChipInput;
