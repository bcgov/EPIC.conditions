import {
    Box,
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TableRow,
  } from "@mui/material";
  import { BCDesignTokens } from "epic.theme";
  import { DocumentModel } from "@/models/Document";
  import { StyledTableHeadCell } from "../Shared/Table/common";
  import DocumentTableRow from "./DocumentTableRow";
  
  export default function DocumentTable({
    documents,
    headless,
  }: {
    documents: Array<DocumentModel>;
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
                            p: BCDesignTokens.layoutPaddingXsmall,
                        },
                    }}
                    >
                    <TableRow>
                        <StyledTableHeadCell
                            align="left"
                            sx={{
                                width: '40%',
                                paddingLeft: BCDesignTokens.layoutPaddingXsmall,
                            }}
                        >
                            Document Type
                        </StyledTableHeadCell>
                        <StyledTableHeadCell
                            align="right"
                            sx={{
                                width: '20%',
                            }}
                        >
                            Amendment Count
                        </StyledTableHeadCell>
                        <StyledTableHeadCell
                            align="right"
                            sx={{
                                width: '20%',
                            }}
                        >
                            Year Issued
                        </StyledTableHeadCell>
                        <StyledTableHeadCell
                            align="right"
                            sx={{
                                width: '20%',
                            }}
                        >
                            Status
                        </StyledTableHeadCell>
                    </TableRow>
                </TableHead>
            )}
            <TableBody>
            {documents?.map((document) => (
                <DocumentTableRow
                    key={document.document_id}
                    document={document}
                />
            ))}
            </TableBody>
            </Table>
        </TableContainer>
    );
  }
  