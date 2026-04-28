import { Link, TableCell, TableRow, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import DocumentStatusChip from "../Projects/DocumentStatusChip";
import { DocumentStatus } from "@/models/Document";
import { ConditionModel } from "@/models/Condition";
import { useNavigate } from "@tanstack/react-router";
import { DocumentTypes } from "@/utils/enums"
import { useBreadCrumb } from "@/components/Shared/layout/SideNav/breadCrumbStore";

interface ConditionRowProps {
  condition: ConditionModel;
  projectId: string;
  documentId: string;
  documentTypeId: number;
  tableType: string;
}
const border = `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`;

export default function ConditionTableRow({
    condition,
    projectId,
    documentId,
    documentTypeId,
    tableType
}: ConditionRowProps) {

  const navigate = useNavigate();
  const { setIsFromConsolidated } = useBreadCrumb();

  const handleOnDocumentClick = (projectId: string, documentId?: string, conditionId?: number) => {
    if (tableType === "consolidated") {
      setIsFromConsolidated(true);
    } else {
      setIsFromConsolidated(false);
    }
    navigate({
      to: `/conditions/project/${projectId}/document/${documentId}/condition/${conditionId}`,
    });
  };

  return (
    <>
      <TableRow
        key={`row-${condition.condition_number}`}
        sx={{
          my: 1,
          "&:hover": {
            backgroundColor: BCDesignTokens.surfaceColorMenusHover,
          },
        }}
      >
        {documentTypeId !== DocumentTypes.Amendment && (
          <TableCell
            align="left"
            sx={{
              borderBottom: border,
              p: BCDesignTokens.layoutPaddingXsmall,
            }}
          >
            {condition.amendment_names ?? "--"}
          </TableCell>
        )}
        <TableCell
          align="left"
          sx={{
            borderBottom: border,
            p: BCDesignTokens.layoutPaddingXsmall,
          }}
        >
          {condition.condition_number ?? "--"}
        </TableCell>
        <TableCell
          align="left"
          sx={{
            borderBottom: border,
            p: BCDesignTokens.layoutPaddingXsmall,
          }}
        >
          <Link
            sx={{
              color: BCDesignTokens.themeBlue90,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
            }}
            component={"button"}
            onClick={() => handleOnDocumentClick(
              projectId,
              documentId !== "" ? documentId : condition.effective_document_id,
              condition.condition_id
            )}
          >
            <Typography
              component="span"
              color={BCDesignTokens.themeBlue90}
              fontWeight={"normal"}
              fontSize={16}
              sx={{ textAlign: "left" }}
            >
              {condition.condition_name ?? "--"}
            </Typography>
          </Link>
        </TableCell>
        <TableCell
          align="left"
          sx={{
            borderBottom: border,
            p: BCDesignTokens.layoutPaddingXsmall,
          }}
        >
          {condition.topic_tags?.join(', ') ?? "--"}
        </TableCell>
        <TableCell
          align="left"
          sx={{
            borderBottom: border,
            p: BCDesignTokens.layoutPaddingXsmall,
          }}
        >
          {condition.year_issued ?? "--"}
        </TableCell>
        {tableType == "consolidated" && <TableCell
          align="left"
          sx={{
            borderBottom: border,
            p: BCDesignTokens.layoutPaddingXsmall,
          }}
        >
          {condition.source_document ?? "--"}
        </TableCell>}
        <TableCell
          align="left"
          sx={{
            borderBottom: border,
            p: BCDesignTokens.layoutPaddingXsmall,
          }}
        >
          {condition.is_standard_condition ?? "--"}
        </TableCell>
        <TableCell
          align="left"
          sx={{
            borderBottom: border,
            p: BCDesignTokens.layoutPaddingXsmall,
          }}
        >
          <DocumentStatusChip status={String(condition.is_approved) as DocumentStatus} />
        </TableCell>
      </TableRow>
      <TableRow key={`empty-row-${condition.condition_number}`} sx={{ py: 1 }}>
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
