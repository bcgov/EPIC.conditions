import { Box, Grid, Typography } from "@mui/material";
import { SearchFilter } from "./SearchFilter";
import { StatusFilter } from "./StatusFilter";
import { SourceDocumentFilter } from "./SourceDocumentFilter";
import { AmendedInFilter } from "./AmendedIn";
import { YearIssuedFilter } from "./YearIssued";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import { BCDesignTokens } from "epic.theme";
import { useConditionFilters } from "./conditionFilterStore";
import { ConditionModel } from "@/models/Condition";

type FilterProps = {
  conditions?: ConditionModel[];
};

function ConsolidatedConditionFilters({ conditions }: FilterProps) {
  const { filters, setFilters, resetFilters } = useConditionFilters();

  return (
    <Grid
      container
      item
      wrap="nowrap"
      sx={{
        justifyContent: "space-between",
        gap: 1,
        paddingLeft: 2,
        paddingRight: 2,
        overflowX: "auto",
      }}
    >
      <Grid item xs={3}>
        <SearchFilter
          searchType="condition"
          value={filters.search_text}
          onChange={(value) => setFilters({ search_text: value })}
        />
      </Grid>
      <Grid item xs={3}>
        <SourceDocumentFilter conditions={conditions}/>
      </Grid>
      <Grid item xs={1.5}>
        <AmendedInFilter conditions={conditions}/>
      </Grid>
      <Grid item xs={1.5}>
        <YearIssuedFilter conditions={conditions}/>
      </Grid>
      <Grid item xs={1.5}>
        <StatusFilter />
      </Grid>
      <Grid item xs={1}>
        <Box
          display={"flex"}
          flexDirection={"row"}
          mt={BCDesignTokens.layoutMarginSmall}
          onClick={() => resetFilters()}
          sx={{ cursor: "pointer" }}
        >
          <Typography
            variant="caption"
            sx={{
              color: BCDesignTokens.typographyColorLink,
            }}
          >
            Clear Filters
          </Typography>
          <FilterAltOffOutlinedIcon
            fontSize="small"
            htmlColor={BCDesignTokens.typographyColorLink}
          />
        </Box>
      </Grid>
    </Grid>
  );
}

export default ConsolidatedConditionFilters;
