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

type AmendedInFilterProps = {
    conditions?: { amendment_names?: string | null }[];
};

export function AmendedInFilter({ conditions }: AmendedInFilterProps) {
    const { filters, setFilters } = useConditionFilters();

    const sourceDocs = Array.from(
        new Set(conditions?.map((c) => c.amendment_names).filter(Boolean))
    ) as string[];

    const handleChange = (event: SelectChangeEvent<string>) => {
        const value = event.target.value;
        setFilters({ amendment_names: value || "" });
    };

    return (
        <FormControl fullWidth>
            <Select
                labelId="source-document-select-label"
                id="source-document-select"
                value={filters.amendment_names || ""}
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
                                Amended In
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
                        Amended In
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
