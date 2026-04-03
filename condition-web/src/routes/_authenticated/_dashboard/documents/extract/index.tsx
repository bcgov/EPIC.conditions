import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Grid } from "@mui/material";
import { useGetDocumentType } from "@/hooks/api/useDocuments";
import { useGetProjects } from "@/hooks/api/useProjects";
import { PageGrid } from "@/components/Shared/PageGrid";
import { DocumentEntryPage } from "@/components/Documents/DocumentEntryPage";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useBreadCrumb } from "@/components/Shared/layout/SideNav/breadCrumbStore";

export const Route = createFileRoute(
    "/_authenticated/_dashboard/documents/extract/"
)({
    component: DocumentExtractPage,
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
                />
            </Grid>
        </PageGrid>
    );
}
