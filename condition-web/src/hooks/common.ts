import { useBreadCrumb } from "@/components/Shared/layout/SideNav/breadCrumbStore";
import { useMediaQuery, useTheme } from "@mui/material";
import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

export const useIsMobile = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return isMobile;
};

export const useUpdateBreadcrumb = <T>(
  title: string,
  name: string,
  dependency: T,
) => {
  const { replaceBreadcrumb } = useBreadCrumb();
  const matches = useRouterState({ select: (s) => s.matches });

  useEffect(() => {
    replaceBreadcrumb(title, name);
  }, [replaceBreadcrumb, title, matches, name, dependency]);
};
