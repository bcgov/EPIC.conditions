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

type SourceDocumentFilterProps = {
    conditions?: { source_document?: string | null }[];
};

export function SourceDocumentFilter({ conditions }: SourceDocumentFilterProps) {
    const { filters, setFilters } = useConditionFilters();

    const sourceDocs = Array.from(
        new Set(conditions?.map((c) => c.source_document).filter(Boolean))
    ) as string[];

    const handleChange = (event: SelectChangeEvent<string>) => {
        const value = event.target.value;
        setFilters({ source_document: value || "" });
    };

    return (
        <FormControl fullWidth>
            <Select
                labelId="source-document-select-label"
                id="source-document-select"
                value={filters.source_document || ""}
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
                                Source Document
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
                        Source Document
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
