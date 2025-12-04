import { useState } from "react";
import {
  TextField,
  MenuItem,
  InputAdornment,
  Stack,
  styled,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import SearchIcon from "@mui/icons-material/Search";

export type FilterKeys = "searchText" | "sourceDoc" | "amendment" | "year" | "status";

export type ConditionFiltersProps = {
  sourceDocs?: string[];
  amendments?: string[];
  years?: number[];
  statusOptions?: { value: string; label: string }[];
  showSourceDocFilter?: boolean; // Show source doc filter only for consolidated
  onFiltersChange: (filters: {
    searchText: string;
    sourceDoc: string;
    amendment: string;
    year: string;
    status: string;
  }) => void;
  initialFilters?: {
    searchText?: string;
    sourceDoc?: string;
    amendment?: string;
    year?: string;
    status?: string;
  };
};

const FiltersStack = styled(Stack)({
  gap: BCDesignTokens.layoutPaddingSmall,
});

export const ConditionFilters = ({
  sourceDocs = [],
  amendments = [],
  years = [],
  statusOptions = [
    { value: "true", label: "Approved" },
    { value: "false", label: "Awaiting Approval" },
  ],
  showSourceDocFilter = false,
  onFiltersChange,
  initialFilters,
}: ConditionFiltersProps) => {
  const [searchText, setSearchText] = useState(initialFilters?.searchText ?? "");
  const [sourceDocFilter, setSourceDocFilter] = useState(
    initialFilters?.sourceDoc ?? "Source Document"
  );
  const [amendmentFilter, setAmendmentFilter] = useState(
    initialFilters?.amendment ?? "Amendment In"
  );
  const [yearFilter, setYearFilter] = useState(
    initialFilters?.year ?? "Year Issued"
  );
  const [statusFilter, setStatusFilter] = useState(
    initialFilters?.status ?? "Status"
  );

  const handleChange = (key: FilterKeys, value: string) => {
    switch (key) {
      case "searchText":
        setSearchText(value);
        break;
      case "sourceDoc":
        setSourceDocFilter(value);
        break;
      case "amendment":
        setAmendmentFilter(value);
        break;
      case "year":
        setYearFilter(value);
        break;
      case "status":
        setStatusFilter(value);
        break;
    }

    onFiltersChange({
      searchText: key === "searchText" ? value : searchText,
      sourceDoc: key === "sourceDoc" ? value : sourceDocFilter,
      amendment: key === "amendment" ? value : amendmentFilter,
      year: key === "year" ? value : yearFilter,
      status: key === "status" ? value : statusFilter,
    });
  };

  return (
    <FiltersStack
      direction="row"
      spacing={2}
      sx={{ ml: 2, mb: 2, px: BCDesignTokens.layoutPaddingXsmall }}
    >
      {/* Search */}
      <TextField
        variant="outlined"
        placeholder="Search Conditions"
        size="small"
        sx={{ flex: { xs: "auto", sm: "0 0 30%" }, width: "100%" }}
        value={searchText}
        onChange={(e) => handleChange("searchText", e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* Source Document (only for consolidated) */}
      {showSourceDocFilter && (
        <TextField
          variant="outlined"
          select
          size="small"
          sx={{ flex: { xs: "auto" }, width: "10%" }}
          value={sourceDocFilter}
          onChange={(e) => handleChange("sourceDoc", e.target.value)}
        >
          <MenuItem value="Source Document">
            <span
              style={{
                color: BCDesignTokens.themeGray70,
                fontSize: BCDesignTokens.typographyFontSizeSmallBody,
              }}
            >
              Source Document
            </span>
          </MenuItem>
          {sourceDocs.map((doc) => (
            <MenuItem key={doc} value={doc}>
              {doc}
            </MenuItem>
          ))}
        </TextField>
      )}

      {/* Amendment */}
      <TextField
        variant="outlined"
        select
        size="small"
        sx={{ flex: { xs: "auto" }, width: "10%" }}
        value={amendmentFilter}
        onChange={(e) => handleChange("amendment", e.target.value)}
      >
        <MenuItem value="Amendment In">
          <span
            style={{
              color: BCDesignTokens.themeGray70,
              fontSize: BCDesignTokens.typographyFontSizeSmallBody,
            }}
          >
            Amendment In
          </span>
        </MenuItem>
        {amendments.map((a) => (
          <MenuItem key={a} value={a}>
            {a}
          </MenuItem>
        ))}
      </TextField>

      {/* Year */}
      <TextField
        variant="outlined"
        select
        size="small"
        sx={{ flex: { xs: "auto" }, width: "10%" }}
        value={yearFilter}
        onChange={(e) => handleChange("year", e.target.value)}
      >
        <MenuItem value="Year Issued">
          <span
            style={{
              color: BCDesignTokens.themeGray70,
              fontSize: BCDesignTokens.typographyFontSizeSmallBody,
            }}
          >
            Year Issued
          </span>
        </MenuItem>
        {years.map((y) => (
          <MenuItem key={y} value={String(y)}>
            {y}
          </MenuItem>
        ))}
      </TextField>

      {/* Status */}
      <TextField
        variant="outlined"
        select
        size="small"
        sx={{ flex: { xs: "auto" }, width: "10%" }}
        value={statusFilter}
        onChange={(e) => handleChange("status", e.target.value)}
      >
        <MenuItem value="Status">
          <span
            style={{
              color: BCDesignTokens.themeGray70,
              fontSize: BCDesignTokens.typographyFontSizeSmallBody,
            }}
          >
            Status
          </span>
        </MenuItem>
        {statusOptions.map((s) => (
          <MenuItem key={s.value} value={s.value}>
            {s.label}
          </MenuItem>
        ))}
      </TextField>
    </FiltersStack>
  );
};
