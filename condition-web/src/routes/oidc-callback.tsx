import { PageLoader } from "@/components/Shared/PageLoader";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useGetUserByGuid } from "@/hooks/api/useStaffUsers";
import { useAuth } from "react-oidc-context";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/oidc-callback")({
  component: OidcCallback,
});

function OidcCallback() {
  const { error: getAuthError, user: kcUser } = useAuth();
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    if (kcUser) {
      setIsAuthLoading(false);
    }
  }, [kcUser, setIsAuthLoading]);

  const { data: userData, isLoading: isUserDataLoading } = useGetUserByGuid({
    guid: kcUser?.profile.sub,
  });

  if (userData?.auth_guid) {
    return <Navigate to="/projects" />;
  }

  if (getAuthError) {
    return <Navigate to="/error" />;
  }

  if (!isAuthLoading && !isUserDataLoading) {
    return <PageLoader />;
  }

  return <PageLoader />;
}
