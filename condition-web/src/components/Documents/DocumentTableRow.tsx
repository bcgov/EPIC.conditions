import { ArrowForwardIos } from "@mui/icons-material";
import { Link, TableCell, TableRow, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import DocumentStatusChip from "../Projects/DocumentStatusChip";
import { AllDocumentModel, DocumentStatus } from "@/models/Document";
import { useNavigate } from "@tanstack/react-router";

interface DocumentRowProps {
  projectId: string;
  document: AllDocumentModel;
}

const border = `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`;

export default function DocumentTableRow({ projectId, document }: DocumentRowProps) {

  const navigate = useNavigate();
  const handleOnDocumentClick = () => {
    if (projectId && projectId) {
        navigate({
        to: `/conditions/project/${projectId}/document/${document.document_id}`,
        });
    }
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
              {document.document_label ?? "--"}
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
          {document.year_issued ?? "--"}
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
          <DocumentStatusChip status={document.status === null ? "nodata" : String(document.status) as DocumentStatus} />
        </TableCell>
      </TableRow>
      <TableRow key={`empty-row-${document.document_id}`}>
        <TableCell colSpan={12} sx={{ border: 0, py: BCDesignTokens.layoutPaddingXsmall }} />
      </TableRow>
    </>
  );
}
