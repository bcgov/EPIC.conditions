import React, { useEffect, useMemo } from "react";
import { Box, Breadcrumbs } from "@mui/material";
import { Link, useRouterState } from "@tanstack/react-router";
import { theme } from "@/styles/theme";
import { useBreadCrumb } from "./breadCrumbStore";
import { RouteMeta, RouteSegment } from './types';

const BreadcrumbNav: React.FC = () => {
  const { breadcrumbs, setBreadcrumbs } = useBreadCrumb();
  const matches = useRouterState({ select: (s) => s.matches });

  const routeMatches: RouteSegment[] = useMemo(() => {
    return matches.flatMap((match) => {
      const { meta, pathname } = match;

      const metaSegments = meta as RouteMeta[];

      if (metaSegments && Array.isArray(metaSegments)) {
        return metaSegments.map((segment) => ({
          title: segment.title,
          path: segment.path || pathname,
        }));
      }
      return [];
    });
  }, [matches]);

  useEffect(() => {
    setBreadcrumbs(routeMatches);
  }, [routeMatches, setBreadcrumbs]);

  return (
    <Box
      sx={{
        p: 1,
        paddingLeft: theme.spacing(4),
        borderBottom: "1px solid #0000001A",
      }}
    >
      <Breadcrumbs aria-label="breadcrumb">
        {breadcrumbs.map(({ title, path }) => (
          <Link
            key={path}
            style={{
              color: theme.palette.primary.dark,
              textDecoration: "underline",
            }}
            to={path}
          >
            {title}
          </Link>
        ))}
      </Breadcrumbs>
    </Box>
  );
};

export default BreadcrumbNav;
