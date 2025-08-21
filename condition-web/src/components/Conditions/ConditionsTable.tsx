import {
    Box,
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
  } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { ConditionModel } from "@/models/Condition";
import { StyledTableHeadCell } from "../Shared/Table/common";
import ConditionTableRow from "./ConditionTableRow";
import { DocumentTypes } from "@/utils/enums";
import { useState } from "react";

type Order = "asc" | "desc";

export default function ConditionTable({
    conditions,
    projectId,
    documentId,
    headless,
    noConditions,
    documentTypeId,
    tableType
}: {
    conditions: Array<ConditionModel>;
    projectId: string;
    documentId: string;
    headless?: boolean;
    noConditions: boolean;
    documentTypeId: number;
    tableType: string;
}) {
    const [order, setOrder] = useState<Order>("asc");
    const [orderBy, setOrderBy] = useState<keyof ConditionModel | "">("");

    const handleSort = (property: keyof ConditionModel) => {
        const isAsc = orderBy === property && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(property);
    };

    const getComparator = (order: Order, orderBy: keyof ConditionModel) => {
        return (a: ConditionModel, b: ConditionModel) => {
        const aValue = a[orderBy];
        const bValue = b[orderBy];

        // Numeric columns
        if (["condition_number", "year_issued"].includes(orderBy)) {
            const aNum = Number(aValue) || 0;
            const bNum = Number(bValue) || 0;
            return order === "asc" ? aNum - bNum : bNum - aNum;
        }

        // Boolean columns
        if (typeof aValue === "boolean" || typeof bValue === "boolean") {
            const aBool = aValue ? 1 : 0;
            const bBool = bValue ? 1 : 0;
            return order === "asc" ? aBool - bBool : bBool - aBool;
        }

        // Array columns
        if (Array.isArray(aValue) || Array.isArray(bValue)) {
            const aStr = Array.isArray(aValue) ? aValue.join(", ") : "";
            const bStr = Array.isArray(bValue) ? bValue.join(", ") : "";
            return order === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
        }

        // Default: string comparison
        const aStr = aValue != null ? aValue.toString() : "";
        const bStr = bValue != null ? bValue.toString() : "";
        return order === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
        };
    };

    const sortedConditions =
        orderBy !== ""
        ? [...conditions].sort(getComparator(order, orderBy as keyof ConditionModel))
        : conditions;

    return (
        <TableContainer component={Box} sx={{ height: "100%", overflowY: 'auto', minWidth: 1000 }}>
            <Table sx={{ tableLayout: "fixed", border: 0 }} aria-label="condition table">
                {!headless && (
                    <TableHead
                    sx={{
                            border: 0,
                            ".MuiTableCell-root": { p: BCDesignTokens.layoutPaddingXsmall },
                        }}
                    >
                    <TableRow>
                        <StyledTableHeadCell colSpan={2}>
                            <TableSortLabel
                                active={orderBy === "condition_number"}
                                direction={orderBy === "condition_number" ? order : "asc"}
                                onClick={() => handleSort("condition_number")}
                            >
                                Condition Number
                            </TableSortLabel>
                        </StyledTableHeadCell>

                        <StyledTableHeadCell colSpan={6}>
                            <TableSortLabel
                                active={orderBy === "condition_name"}
                                direction={orderBy === "condition_name" ? order : "asc"}
                                onClick={() => handleSort("condition_name")}
                            >
                                Condition Name
                            </TableSortLabel>
                        </StyledTableHeadCell>

                        {documentTypeId !== DocumentTypes.Amendment && (
                            <StyledTableHeadCell colSpan={2} align="right">
                                <TableSortLabel
                                    active={orderBy === "amendment_names"}
                                    direction={orderBy === "amendment_names" ? order : "asc"}
                                    onClick={() => handleSort("amendment_names")}
                                >
                                    Amendment In
                                </TableSortLabel>
                            </StyledTableHeadCell>
                        )}

                        <StyledTableHeadCell colSpan={2} align="right">
                            <TableSortLabel
                                active={orderBy === "topic_tags"}
                                direction={orderBy === "topic_tags" ? order : "asc"}
                                onClick={() => handleSort("topic_tags")}
                            >
                                Tags
                            </TableSortLabel>
                        </StyledTableHeadCell>

                        <StyledTableHeadCell colSpan={2} align="right">
                            <TableSortLabel
                                active={orderBy === "year_issued"}
                                direction={orderBy === "year_issued" ? order : "asc"}
                                onClick={() => handleSort("year_issued")}
                            >
                                Year Issued
                            </TableSortLabel>
                        </StyledTableHeadCell>

                        {tableType === "consolidated" && (
                            <StyledTableHeadCell colSpan={2} align="right">
                                <TableSortLabel
                                    active={orderBy === "source_document"}
                                    direction={orderBy === "source_document" ? order : "asc"}
                                    onClick={() => handleSort("source_document")}
                                >
                                    Source Document
                                </TableSortLabel>
                            </StyledTableHeadCell>
                        )}

                        <StyledTableHeadCell colSpan={2} align="center">
                            <TableSortLabel
                                active={orderBy === "is_standard_condition"}
                                direction={orderBy === "is_standard_condition" ? order : "asc"}
                                onClick={() => handleSort("is_standard_condition")}
                            >
                                Standard Condition
                            </TableSortLabel>
                        </StyledTableHeadCell>

                        <StyledTableHeadCell colSpan={2} align="center">
                            <TableSortLabel
                                active={orderBy === "is_approved"}
                                direction={orderBy === "is_approved" ? order : "asc"}
                                onClick={() => handleSort("is_approved")}
                            >
                                Status
                            </TableSortLabel>
                        </StyledTableHeadCell>
                    </TableRow>
                </TableHead>
                )}

                <TableBody>
                    {!noConditions && sortedConditions.map((condition) => (
                        <ConditionTableRow
                            key={condition.condition_id}
                            condition={condition}
                            projectId={projectId}
                            documentId={documentId}
                            documentTypeId={documentTypeId}
                            tableType={tableType}
                        />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
