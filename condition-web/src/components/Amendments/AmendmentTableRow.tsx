import { ArrowForwardIos } from "@mui/icons-material";
import { Link, TableCell, TableRow, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import DocumentStatusChip from "../Documents/DocumentStatusChip";
import { AllDocumentModel, DocumentStatus } from "@/models/Document";

interface AmendmentRowProps {
  amendment: AllDocumentModel;
}

const border = `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`;

export default function AmendmentTableRow({ amendment }: AmendmentRowProps) {
  const handleOnDocumentClick = () => {};

  return (
    <>
      <TableRow
        key={`row-${amendment.document_id}`}
        sx={{
          "&:hover": {
            backgroundColor: BCDesignTokens.surfaceColorMenusHover,
          },
        }}
      >
        <TableCell
          align="left"
          sx={{
            borderTop: border,
            borderBottom: border,
            padding: BCDesignTokens.layoutPaddingXsmall,
            width: '50%', // Ensure width matches header
          }}
        >
          <Link
            sx={{
              color: BCDesignTokens.themeBlue90,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
            }}
            component={"button"}
            onClick={() => handleOnDocumentClick()}
          >
            <Typography
              color={BCDesignTokens.themeBlue90}
              fontWeight={"bold"}
              fontSize={18}
              align="left"
            >
              {amendment.document_name ?? "--"}
            </Typography>
            <ArrowForwardIos fontSize="small" />
          </Link>
        </TableCell>
        <TableCell
          align="right"
          sx={{
            borderTop: border,
            borderBottom: border,
            padding: BCDesignTokens.layoutPaddingXsmall,
            width: '25%', // Ensure width matches header
          }}
        >
          {amendment.year_issued ?? "--"}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            borderTop: border,
            borderBottom: border,
            padding: BCDesignTokens.layoutPaddingXsmall,
            width: '25%', // Ensure width matches header
          }}
        >
          <DocumentStatusChip status={String(amendment.status) as DocumentStatus} />
        </TableCell>
      </TableRow>
      <TableRow key={`empty-row-${amendment.document_id}`}>
        <TableCell colSpan={12} sx={{ border: 0, py: BCDesignTokens.layoutPaddingXsmall }} />
      </TableRow>
    </>
  );
}
