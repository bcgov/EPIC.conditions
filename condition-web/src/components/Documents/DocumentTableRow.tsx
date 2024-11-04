import { ArrowForwardIos } from "@mui/icons-material";
import { Link, TableCell, TableRow, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import DocumentStatusChip from "./DocumentStatusChip";
import { DocumentModel, DocumentStatus } from "@/models/Document";
import { useNavigate } from "@tanstack/react-router";

interface DocumentRowProps {
  document: DocumentModel;
}
const border = `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`;

export default function DocumentTableRow({
    document,
}: DocumentRowProps) {

  const navigate = useNavigate();

  const handleOnDocumentClick = (projectId: string, documentId: string) => {
    navigate({
      to: `/amendments/project/${projectId}/document/${documentId}`,
    });
  };

  return (
    <>
      <TableRow
        key={`row-${document.document_id}`}
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
            py: BCDesignTokens.layoutPaddingXsmall,
            paddingLeft: BCDesignTokens.layoutPaddingXsmall,
            width: '40%',
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
            onClick={() => handleOnDocumentClick(document.project_id, document.document_id)}
          >
            <Typography
              color={BCDesignTokens.themeBlue90}
              fontWeight={"bold"}
              fontSize={18}
              sx={{ mr: 0.5 }}
            >
              {document.document_type ?? "--"}
            </Typography>
            <ArrowForwardIos fontSize="small" />
          </Link>
        </TableCell>
        <TableCell
          align="right"
          sx={{
            borderTop: border,
            borderBottom: border,
            py: BCDesignTokens.layoutPaddingXsmall,
            width: '20%',
          }}
        >
          {document.amendment_count}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            borderTop: border,
            borderBottom: border,
            py: BCDesignTokens.layoutPaddingXsmall,
            width: '20%',
          }}
        >
          {document.date_issued ? new Date(document.date_issued).getFullYear() : "--"}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            borderTop: border,
            borderBottom: border,
            py: BCDesignTokens.layoutPaddingXsmall,
            paddingRight: BCDesignTokens.layoutPaddingXsmall,
            width: '20%',
          }}
        >
          <DocumentStatusChip status={String(document.status) as DocumentStatus} />
        </TableCell>
      </TableRow>
      <TableRow key={`empty-row-${document.document_id}`} sx={{ py: 1 }}>
        <TableCell
          component="th"
          scope="row"
          colSpan={12}
          sx={{
            border: 0,
            py: BCDesignTokens.layoutPaddingXsmall,
          }}
        />
      </TableRow>
    </>
  );
}
