import { useEffect, useLayoutEffect } from "react";
import { useBreadCrumb } from "@/components/Shared/layout/SideNav/breadCrumbStore";

/**
 * Manages breadcrumbs for the project-level consolidated conditions page.
 * Uses useLayoutEffect to synchronously reset the isFromConsolidated flag and
 * set placeholder breadcrumbs before the first paint, preventing stale breadcrumbs
 * from the condition detail page from briefly appearing on navigation back.
 */
export const useProjectConsolidatedBreadcrumbs = (projectId: string, projectName?: string) => {
  const { setBreadcrumbs, setIsFromConsolidated } = useBreadCrumb();

  useLayoutEffect(() => {
    setIsFromConsolidated(false);
    setBreadcrumbs([
      { title: "Home", path: "/projects", clickable: true },
      { title: projectId, path: `/projects/${projectId}`, clickable: true },
      { title: "Consolidated Conditions", path: undefined, clickable: false },
    ]);
  }, [projectId, setIsFromConsolidated, setBreadcrumbs]);

  useEffect(() => {
    if (projectName) {
      setBreadcrumbs([
        { title: "Home", path: "/projects", clickable: true },
        { title: projectName, path: `/projects/${projectId}`, clickable: true },
        { title: "Consolidated Conditions", path: undefined, clickable: false },
      ]);
    }
  }, [projectId, projectName, setBreadcrumbs]);
};
