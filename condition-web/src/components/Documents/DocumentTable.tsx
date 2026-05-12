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
  import DocumentTableRow from "./DocumentTableRow";

  interface GroupedDocument {
    cert: AllDocumentModel;
    amendments: AllDocumentModel[];
  }

  function groupDocuments(documents: AllDocumentModel[]): GroupedDocument[] {
    const certDocs = documents.filter((d) => !d.parent_document_id);
    return certDocs.map((cert) => ({
      cert,
      amendments: documents.filter((d) => d.parent_document_id === cert.document_id),
    }));
  }

  export default function DocumentTable({
    projectId,
    documents,
    headless,
  }: {
    projectId: string,
    documents: Array<AllDocumentModel>;
    headless?: boolean;
  }) {
    const grouped = groupDocuments(documents);

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
            {grouped.map(({ cert, amendments }) => (
              <DocumentTableRow
                projectId={projectId}
                key={cert.document_id}
                document={cert}
                amendments={amendments}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
  