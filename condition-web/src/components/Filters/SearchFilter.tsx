import React, { useState, useEffect } from "react";
import { InputAdornment, IconButton, TextField } from "@mui/material";
import { Search, Clear } from "@mui/icons-material";
import { BCDesignTokens } from "epic.theme";

type SearchFilterProps = {
  searchType: "project" | "condition";
  value: string;
  onChange: (value: string) => void;
};

export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchType,
  value,
  onChange,
}) => {
  const [searchText, setSearchText] = useState(value);

  // keep local state in sync with prop
  useEffect(() => {
    setSearchText(value);
  }, [value]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onChange(searchText);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
    onChange(event.target.value);
  };

  const handleClear = () => {
    setSearchText("");
    onChange("");
  };

  return (
    <TextField
      fullWidth
      variant="outlined"
      placeholder={searchType === "project" ? "Search Projects" : "Search Conditions"}
      value={searchText}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search htmlColor={BCDesignTokens.typographyColorPlaceholder} />
          </InputAdornment>
        ),
        endAdornment: searchText && (
          <InputAdornment position="end">
            <IconButton onClick={handleClear}>
              <Clear htmlColor={BCDesignTokens.typographyColorPlaceholder} />
            </IconButton>
          </InputAdornment>
        ),
      }}
      inputProps={{
        sx: {
          "::placeholder": {
            fontSize: BCDesignTokens.typographyFontSizeSmallBody,
          },
        },
      }}
    />
  );
};
