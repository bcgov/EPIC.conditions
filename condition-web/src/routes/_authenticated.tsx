import { PageLoader } from "@/components/Shared/PageLoader";
import { useGetUserByGuid } from "@/hooks/api/useStaffUsers";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/_authenticated")({
  component: Auth,
});

function Auth() {
  const {
    isAuthenticated,
    signinRedirect,
    isLoading: isUserAuthLoading,
    user,
  } = useAuth();
  const { data: staffUserData, isPending: isUserAccountLoading } =
    useGetUserByGuid({
      guid: user?.profile.sub,
    });

  const isLoading = isUserAuthLoading || isUserAccountLoading;

  useEffect(() => {
    if (!isAuthenticated && !isUserAuthLoading) {
      signinRedirect();
    }
  }, [
    isAuthenticated,
    isUserAuthLoading,
    signinRedirect,
    staffUserData,
    isLoading,
  ]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to={"/"} />;
  }

  return <Outlet />;
}
