import { useEffect } from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { Grid } from "@mui/material";
import { useGetDocumentType } from "@/hooks/api/useDocuments";
import { useGetProjects } from "@/hooks/api/useProjects";
import { PageGrid } from "@/components/Shared/PageGrid";
import { DocumentEntryPage } from "@/components/Documents/DocumentEntryPage";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useBreadCrumb } from "@/components/Shared/layout/SideNav/breadCrumbStore";

export const Route = createFileRoute(
    "/_authenticated/documents/extract/"
)({
    component: DocumentExtractPage,
    validateSearch: (search: Record<string, unknown>) => ({
        manualEntry: search.manualEntry === true || search.manualEntry === "true",
        projectId: typeof search.projectId === "string" ? search.projectId : undefined,
        documentTypeId: typeof search.documentTypeId === "number"
            ? search.documentTypeId
            : typeof search.documentTypeId === "string" && search.documentTypeId
                ? Number(search.documentTypeId)
                : undefined,
        documentLabel: typeof search.documentLabel === "string" ? search.documentLabel : undefined,
        dateIssued: typeof search.dateIssued === "string" ? search.dateIssued : undefined,
    }),
    meta: () => [
        { title: "Home", path: "/projects" },
        { title: "Add/Extract Document", path: "/documents/extract/" },
    ],
});

export function DocumentExtractPage() {
    const {
        data: projectsData,
        isError: isProjectsError,
    } = useGetProjects();

    const { data: documentTypeData } = useGetDocumentType();
    const { replaceBreadcrumb } = useBreadCrumb();
    const manualEntrySearch = useSearch({ from: Route.id });

    useEffect(() => {
        replaceBreadcrumb("Home", "Home", "/projects", true);
    }, [replaceBreadcrumb]);

    useEffect(() => {
        if (isProjectsError) notify.error("Failed to load projects");
    }, [isProjectsError]);

    return (
        <PageGrid>
            <Grid item xs={12}>
                <DocumentEntryPage
                    projects={projectsData ?? []}
                    documentType={documentTypeData ?? []}
                    manualEntrySearch={manualEntrySearch}
                />
            </Grid>
        </PageGrid>
    );
}
