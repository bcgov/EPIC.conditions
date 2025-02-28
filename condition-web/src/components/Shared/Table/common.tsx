import { styled } from "@mui/system";
import Typography from "@mui/material/Typography";
import TableCell from "@mui/material/TableCell";
import { BCDesignTokens } from "epic.theme";

export const StyledTableHeadCell = styled(TableCell)(() => ({
  color: BCDesignTokens.themeGray70,
  fontSize: BCDesignTokens.typographyFontSizeSmallBody,
  "&:hover": {
    color: BCDesignTokens.surfaceColorMenusHover,
  },
  border: "none",
}));

export const StyledLabel = styled(Typography)(() => ({
  color: BCDesignTokens.themeGray70,
  fontSize: BCDesignTokens.typographyFontSizeSmallBody,
  fontWeight: 500, // Optional: Makes it slightly bolder like a label
  whiteSpace: "nowrap", // Ensures it doesn't wrap unnecessarily
  "&:hover": {
    color: BCDesignTokens.surfaceColorMenusHover,
  },
}));
