import {
    Box,
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TableRow,
  } from "@mui/material";
  import { BCDesignTokens } from "epic.theme";
  import { AllDocumentModel } from "@/models/Document";
  import { StyledTableHeadCell } from "../Shared/Table/common";
  import AmendmentTableRow from "./AmendmentTableRow";
  
  export default function AmendmentTable({
    amendments,
    headless,
  }: {
    amendments: Array<AllDocumentModel>;
    headless?: boolean;
  }) {
    return (
      <TableContainer component={Box} sx={{ height: "100%" }}>
        <Table sx={{ tableLayout: "fixed", border: 0 }} aria-label="simple table">
          {!headless && (
            <TableHead
              sx={{
                border: 0,
                ".MuiTableCell-root": {
                  padding: BCDesignTokens.layoutPaddingXsmall, // Ensure same padding as rows
                },
              }}
            >
              <TableRow>
                <StyledTableHeadCell align="left" sx={{ width: '50%' }}>
                  Document Name
                </StyledTableHeadCell>
                <StyledTableHeadCell align="right" sx={{ width: '25%' }}>
                  Year Issued
                </StyledTableHeadCell>
                <StyledTableHeadCell align="right" sx={{ width: '25%' }}>
                  Status
                </StyledTableHeadCell>
              </TableRow>
            </TableHead>
          )}
          <TableBody>
            {amendments?.map((amendment) => (
              <AmendmentTableRow key={amendment.document_id} amendment={amendment} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
  