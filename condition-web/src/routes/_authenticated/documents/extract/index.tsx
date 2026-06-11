import { useEffect } from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { Grid } from "@mui/material";
import { useGetDocumentType } from "@/hooks/api/useDocuments";
import { useGetAllProjects, useGetProjects } from "@/hooks/api/useProjects";
import { ProjectModel } from "@/models/Project";
import { PageGrid } from "@/components/Shared/PageGrid";
import { DocumentEntryPage } from "@/components/Documents/DocumentEntryPage";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useBreadCrumb } from "@/components/Shared/layout/SideNav/breadCrumbStore";
import BreadcrumbNav from "@/components/Shared/layout/SideNav/BreadcrumbNav";

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
        documentId: typeof search.documentId === "string" ? search.documentId : undefined,
        dateIssued: typeof search.dateIssued === "string" ? search.dateIssued : undefined,
        extractionRequestId: typeof search.extractionRequestId === "number"
            ? search.extractionRequestId
            : typeof search.extractionRequestId === "string" && search.extractionRequestId
                ? Number(search.extractionRequestId)
                : undefined,
    }),
    meta: () => [
        { title: "Home", path: "/projects" },
        { title: "Add/Extract Document", path: "/documents/extract" },
    ],
});

export function DocumentExtractPage() {
    const {
        data: projectsData,
        isError: isProjectsError,
    } = useGetProjects();

    const {
        data: allProjectsData,
        isError: isAllProjectsError,
    } = useGetAllProjects();

    const { data: documentTypeData } = useGetDocumentType();
    const { replaceBreadcrumb } = useBreadCrumb();
    const manualEntrySearch = useSearch({ from: Route.id });

    useEffect(() => {
        replaceBreadcrumb("Home", "Home", "/projects", true);
    }, [replaceBreadcrumb]);

    useEffect(() => {
        if (isProjectsError || isAllProjectsError) notify.error("Failed to load projects");
    }, [isProjectsError, isAllProjectsError]);

    const projects: ProjectModel[] = (allProjectsData ?? []).map((project) => ({
        project_id: project.project_id,
        project_name: project.project_name,
        documents: projectsData?.find((p: ProjectModel) => p.project_id === project.project_id)?.documents ?? [],
    }));

    return (
        <>
            <BreadcrumbNav />
            <PageGrid>
                <Grid item xs={12}>
                    <DocumentEntryPage
                        projects={projects}
                        documentType={documentTypeData ?? []}
                        manualEntrySearch={manualEntrySearch}
                    />
                </Grid>
            </PageGrid>
        </>
    );
}
