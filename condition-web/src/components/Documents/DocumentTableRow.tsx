import { ArrowForwardIos } from "@mui/icons-material";
import { Link, TableCell, TableRow, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import DocumentStatusChip from "../Projects/DocumentStatusChip";
import { AllDocumentModel, DocumentStatus } from "@/models/Document";
import { useNavigate } from "@tanstack/react-router";

interface DocumentRowProps {
  projectId: string;
  document: AllDocumentModel;
  amendments?: AllDocumentModel[];
  isAmendment?: boolean;
}

const border = `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`;

function DocumentRow({ projectId, document, isAmendment }: { projectId: string; document: AllDocumentModel; isAmendment?: boolean }) {
  const navigate = useNavigate();
  const handleOnDocumentClick = () => {
    if (projectId) {
      navigate({
        to: `/conditions/project/${projectId}/document/${document.document_id}`,
      });
    }
  };

  return (
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
          borderBottom: border,
          padding: BCDesignTokens.layoutPaddingXsmall,
          paddingLeft: isAmendment ? 6 : BCDesignTokens.layoutPaddingXsmall,
          width: '50%',
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
          borderBottom: border,
          padding: BCDesignTokens.layoutPaddingXsmall,
          width: '25%',
        }}
      >
        {document.year_issued ?? "--"}
      </TableCell>
      <TableCell
        align="right"
        sx={{
          borderBottom: border,
          padding: BCDesignTokens.layoutPaddingXsmall,
          width: '25%',
        }}
      >
        <DocumentStatusChip status={document.status === null ? "nodata" : String(document.status) as DocumentStatus} />
      </TableCell>
    </TableRow>
  );
}

export default function DocumentTableRow({ projectId, document, amendments }: DocumentRowProps) {
  return (
    <>
      <DocumentRow projectId={projectId} document={document} />
      {amendments?.map((amendment) => (
        <DocumentRow
          key={amendment.document_id}
          projectId={projectId}
          document={amendment}
          isAmendment
        />
      ))}
      <TableRow key={`empty-row-${document.document_id}`}>
        <TableCell colSpan={12} sx={{ border: 0, py: BCDesignTokens.layoutPaddingXsmall }} />
      </TableRow>
    </>
  );
}
