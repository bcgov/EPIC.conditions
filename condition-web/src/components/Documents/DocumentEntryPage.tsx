import { useState } from "react";
import { Paper, Tab, Tabs } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { useNavigate } from "@tanstack/react-router";
import { DocumentTypeModel } from "@/models/Document";
import { ProjectModel } from "@/models/Project";
import { DocumentEntryForm } from "./DocumentEntryForm";
import { DocumentExtractionForm } from "./DocumentExtractionForm";

type DocumentEntryPageProps = {
    projects: ProjectModel[];
    documentType: DocumentTypeModel[];
    manualEntrySearch?: {
        manualEntry?: boolean;
        projectId?: string;
        documentTypeId?: number;
        documentLabel?: string;
        dateIssued?: string;
    };
};

export const DocumentEntryPage = ({
    projects,
    documentType,
    manualEntrySearch,
}: DocumentEntryPageProps) => {
    const [tab, setTab] = useState(manualEntrySearch?.manualEntry ? 1 : 0);
    const navigate = useNavigate();

    return (
        <Paper sx={{ borderRadius: "4px", overflow: "hidden" }}>
            <Tabs
                value={tab}
                onChange={(_, newTab) => setTab(newTab)}
                variant="fullWidth"
                aria-label="Document entry mode"
                sx={{ minHeight: 40 }}
            >
                <Tab icon={<DescriptionIcon />} iconPosition="start" label="Extract from Document" sx={{ minHeight: 40, py: 0.5 }} />
                <Tab icon={<EditNoteIcon />} iconPosition="start" label="Manual Entry" sx={{ minHeight: 40, py: 0.5 }} />
            </Tabs>
            {tab === 0 && (
                <DocumentExtractionForm
                    documentType={documentType}
                />
            )}
            {tab === 1 && (
                <DocumentEntryForm
                    documentType={documentType}
                    projectArray={projects}
                    onCancel={() => navigate({ to: "/projects" })}
                    transferData={manualEntrySearch?.manualEntry ? manualEntrySearch : undefined}
                />
            )}
        </Paper>
    );
};
