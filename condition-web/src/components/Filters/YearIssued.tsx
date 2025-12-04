import {
    Box,
    FormControl,
    MenuItem,
    Select,
    SelectChangeEvent,
    Typography,
} from "@mui/material";
import { useConditionFilters } from "./conditionFilterStore";
import { BCDesignTokens } from "epic.theme";

type YearIssuedFilterProps = {
    conditions?: { year_issued?: number | null }[];
};

export function YearIssuedFilter({ conditions }: YearIssuedFilterProps) {
    const { filters, setFilters } = useConditionFilters();

    const sourceDocs = Array.from(
        new Set(conditions?.map((c) => c.year_issued).filter(Boolean))
    ) as number[];

    const handleChange = (event: SelectChangeEvent<number>) => {
        const value = event.target.value;
        setFilters({ year_issued: Number(value) || 0 });
    };

    return (
        <FormControl fullWidth>
            <Select
                labelId="source-document-select-label"
                id="source-document-select"
                value={filters.year_issued || ""}
                onChange={handleChange}
                displayEmpty // important to show the empty item
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
                                Year Issued
                            </Typography>
                        );
                    }
                    return (
                        <Box>
                            <Typography
                                variant="body2"
                                sx={{
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: 1
                                }}
                            >
                                {selected}
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
                        Year Issued
                    </Typography>
                </MenuItem>

                {sourceDocs.map((doc) => (
                    <MenuItem key={doc} value={doc}>
                        <Typography variant="body2">{doc}</Typography>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
