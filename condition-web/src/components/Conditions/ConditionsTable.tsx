import {
    Box,
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TableRow,
  } from "@mui/material";
  import { BCDesignTokens } from "epic.theme";
  import { ConditionModel } from "@/models/Condition";
  import { StyledTableHeadCell } from "../Shared/Table/common";
  import ConditionTableRow from "./ConditionTableRow";

  export default function ConditionTable({
    conditions,
    projectId,
    documentId,
    headless,
    noConditions,
  }: {
    conditions: Array<ConditionModel>;
    projectId: string;
    documentId: string;
    headless?: boolean;
    noConditions: boolean;
  }) {
    return (
        <TableContainer component={Box} sx={{ height: "100%" }}>
            <Table sx={{ tableLayout: "fixed", border: 0 }} aria-label="simple table">
            {!headless && (
                <TableHead
                sx={{
                    border: 0,
                    ".MuiTableCell-root": {
                    p: BCDesignTokens.layoutPaddingXsmall,
                    },
                }}
                >
                <TableRow>
                    <StyledTableHeadCell colSpan={6}>
                        Condition Name
                    </StyledTableHeadCell>
                    <StyledTableHeadCell colSpan={2} align="right">
                        Amendment In
                    </StyledTableHeadCell>
                    <StyledTableHeadCell colSpan={2} align="right">
                        Tags
                    </StyledTableHeadCell>
                    <StyledTableHeadCell colSpan={2} align="right">
                        Year Issued
                    </StyledTableHeadCell>
                    <StyledTableHeadCell colSpan={2} align="center">
                        Status
                    </StyledTableHeadCell>
                </TableRow>
                </TableHead>
            )}
            <TableBody>
            {!noConditions && conditions?.map((condition) => (
                <ConditionTableRow
                    key={condition.condition_number}
                    condition={condition}
                    projectId={projectId}
                    documentId={documentId}
                />
            ))}
            </TableBody>
            </Table>
        </TableContainer>
    );
  }
  