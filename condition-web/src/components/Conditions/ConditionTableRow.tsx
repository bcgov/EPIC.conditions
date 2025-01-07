import { ArrowForwardIos } from "@mui/icons-material";
import { Link, TableCell, TableRow, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import DocumentStatusChip from "../Projects/DocumentStatusChip";
import { DocumentStatus } from "@/models/Document";
import { ConditionModel } from "@/models/Condition";
import { useNavigate } from "@tanstack/react-router";

interface ConditionRowProps {
  condition: ConditionModel;
  projectId: string;
  documentId: string;
}
const border = `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`;

export default function ConditionTableRow({
    condition,
    projectId,
    documentId,
}: ConditionRowProps) {

  const navigate = useNavigate();
  const handleOnDocumentClick = (projectId: string, documentId: string, conditionNumber?: number) => {
    navigate({
      to: `/conditions/project/${projectId}/document/${documentId}/condition/${conditionNumber}`,
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
        <TableCell
          colSpan={2}
          align="left"
          sx={{
            borderTop: border,
            borderBottom: border,
            py: BCDesignTokens.layoutPaddingXsmall,
          }}
        >
          {condition.condition_number ?? "--"}
        </TableCell>
        <TableCell
          colSpan={6}
          align="left"
          sx={{
            borderTop: border,
            borderBottom: border,
            p: BCDesignTokens.layoutPaddingXsmall,
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
            onClick={() => handleOnDocumentClick(projectId, documentId, condition.condition_number)}
          >
            <Typography
              color={BCDesignTokens.themeBlue90}
              fontWeight={"bold"}
              fontSize={18}
              sx={{ mr: 0.5 }}
              align="left"
            >
              {condition.condition_name ?? "--"}
            </Typography>
            <ArrowForwardIos fontSize="small" />
          </Link>
        </TableCell>
        <TableCell
          colSpan={2}
          align="right"
          sx={{
            borderTop: border,
            borderBottom: border,
            py: BCDesignTokens.layoutPaddingXsmall,
          }}
        >
          {condition.amendment_names ?? "--"}
        </TableCell>
        <TableCell
          colSpan={2}
          align="right"
          sx={{
            borderTop: border,
            borderBottom: border,
            py: BCDesignTokens.layoutPaddingXsmall,
          }}
        >
          {condition.topic_tags?.join(', ') ?? "--"}
        </TableCell>
        <TableCell
          colSpan={2}
          align="right"
          sx={{
            borderTop: border,
            borderBottom: border,
            py: BCDesignTokens.layoutPaddingXsmall,
          }}
        >
          {condition.year_issued ?? "--"}
        </TableCell>
        <TableCell
          colSpan={2}
          align="center"
          sx={{
            borderTop: border,
            borderBottom: border,
            py: BCDesignTokens.layoutPaddingXsmall,
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
