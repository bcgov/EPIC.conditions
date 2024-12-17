import React, { useState } from "react";
import { Box, Chip, IconButton, InputAdornment, TextField } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';

type ChipInputProps = {
  chips: string[];
  setChips: (chips: string[]) => void;
  placeholder?: string;
  inputWidth?: string;
};

const ChipInput: React.FC<ChipInputProps> = ({ chips, setChips, placeholder = "Add a chip", inputWidth = "100%" }) => {
  const [chipInput, setChipInput] = useState("");

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
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", width: inputWidth }}>
      {chips.map((chip, index) => (
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
