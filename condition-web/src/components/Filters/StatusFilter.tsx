import {
  Box,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { useConditionFilters } from "./conditionFilterStore";
import { CONDITION_STATUS } from "@/models/Condition";
import { BCDesignTokens } from "epic.theme";

export function StatusFilter() {
  const { filters, setFilters } = useConditionFilters();

  const handleChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setFilters({ status: value || "" });
};

  return (
    <FormControl fullWidth>
      <Select
        labelId="status-select-label"
        id="status-select"
        value={filters.status ?? ""}
        onChange={handleChange}
        displayEmpty
        sx={{
          "& .MuiInputBase-input": {
            p: BCDesignTokens.layoutPaddingSmall,
          },
          "& .MuiOutlinedInput-notchedOutline": {
            border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault} !important`,
          },
        }}
        renderValue={(selected) => {
          if (!selected) {
            return (
              <Typography
                variant="body2"
                color={BCDesignTokens.typographyColorDisabled}
                sx={{
                  lineHeight: BCDesignTokens.typographyLineHeightsXxdense,
                }}
              >
                Status
              </Typography>
            );
          }

          // 🔑 Map raw value back to label
          const selectedOption = Object.values(CONDITION_STATUS).find(
            (status) => status.value === selected
          );

          return (
            <Box>
              <Typography
                variant="body2"
                sx={{ px: 1, py: 0.25, borderRadius: 1 }}
              >
                {selectedOption?.label ?? selected}
              </Typography>
            </Box>
          );
        }}
      >
        {/* Placeholder item */}
        <MenuItem value="" disabled>
          <Typography
            variant="body2"
            color={BCDesignTokens.typographyColorDisabled}
          >
            Status
          </Typography>
        </MenuItem>

        {Object.values(CONDITION_STATUS).map((status) => (
          <MenuItem key={status.value} value={status.value}>
            {status.label ?? status.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
