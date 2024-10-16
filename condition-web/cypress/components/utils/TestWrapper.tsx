import { ThemeProvider } from "@emotion/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  createRouter,
  RouteComponent,
  RouterProvider,
} from "@tanstack/react-router";
import React from "react";
import { ReactNode } from "react";
import { AuthProvider } from "react-oidc-context";
import { OidcConfig } from "../../../src/utils/config";
import { theme } from "../../../src/styles/theme";

export const TestWrapper = ({
  component,
}: {
  component: RouteComponent<ReactNode>;
}) => {
  const rootRoute = createRootRoute();
  const queryClient = new QueryClient();

  const mockAuth = {
    // mock the necessary properties and methods for useAuth context
    isAuthenticated: true,
    user: { profile: { name: "Test User" } },
    signoutRedirect: cy.stub(),
    signinRedirect: cy.stub(),
    // add other necessary mocks here
  };
  const router = createRouter({
    routeTree: rootRoute,
    context: {
      authentication: mockAuth,
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <AuthProvider {...OidcConfig}>
          <RouterProvider router={router} defaultComponent={component} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
