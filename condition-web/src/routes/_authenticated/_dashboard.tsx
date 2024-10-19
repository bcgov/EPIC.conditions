import BreadcrumbNav from "@/components/Shared/layout/SideNav/BreadcrumbNav";
import { Box } from "@mui/material";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {

  return (
    <div>
      <BreadcrumbNav />
      <Box flexDirection={"row"} display={"flex"}>
        <Outlet />
      </Box>
    </div>
  );
}
