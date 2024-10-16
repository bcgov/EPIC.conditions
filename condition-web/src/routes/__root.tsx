import EAOAppBar from "@/components/Shared/layout/Header/EAOAppBar";
import Footer from "@/components/Shared/layout/Footer";
import PageNotFound from "@/components/Shared/PageNotFound";
import { Box } from "@mui/system";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { AuthContextProps } from "react-oidc-context";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import DrawerProvider from "@/components/Shared/Drawers/DrawerProvider";

type RouterContext = {
  authentication: AuthContextProps;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Layout,
  notFoundComponent: PageNotFound,
});

function Layout() {
  return (
    <>
      <EAOAppBar />
      <DrawerProvider />
      <Box minHeight={"calc(100vh - 88px)"}>
        <Outlet />
      </Box>
      <Footer />
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
