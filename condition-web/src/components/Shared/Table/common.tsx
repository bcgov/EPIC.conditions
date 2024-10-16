import { styled } from "@mui/system";
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
