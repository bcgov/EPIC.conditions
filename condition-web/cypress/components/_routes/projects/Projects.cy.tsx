import { mount } from "cypress/react18";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "../../../../src/routeTree.gen";
import {
  mockAuthentication,
  mockStaffUser,
  mockProjects,
  mockDocumentTypes
} from "../../../utils/mockConstants";
import { setupTokenStorage } from "../../utils";
import { AppConfig, OidcConfig } from "../../../../src/utils/config";
import { AuthProvider } from "react-oidc-context";

describe("projects page", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const mountDefaultPage = () => {
    const router = createRouter({
      routeTree: routeTree,
      context: {
        authentication: mockAuthentication,
        queryClient: queryClient,
      },
    });

    router.navigate({
      to: `/projects`,
    });
    console.log("Router context:", router.options.context);
    mount(
      <QueryClientProvider client={queryClient}>
        <AuthProvider {...OidcConfig}>
          <RouterProvider
            router={router}
            context={{
              authentication: mockAuthentication,
            }}
          />
          ;
        </AuthProvider>
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    cy.viewport(1280, 800);

    setupTokenStorage();

    cy.window().then((win) => {
      console.log("SessionStorage keys:", Object.keys(win.sessionStorage));
      console.log("Stored OIDC user:", win.sessionStorage.getItem(`oidc.user:${OidcConfig.authority}:${OidcConfig.client_id}`));
    });

    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/users/guid/${mockStaffUser.auth_guid}`,
      { body: mockStaffUser }
    ).as("getStaffUser");

    queryClient.clear();
  });

  it("renders projects from API", () => {
    queryClient.clear();

    cy.intercept("GET", `${AppConfig.apiUrl}/projects`, {
      body: mockProjects,
    }).as("getProjects");

    cy.intercept("GET", `${AppConfig.apiUrl}/documents/type`, {
      body: mockDocumentTypes,
    }).as("getDocumentTypes");
    console.log("Intercepts defined for projects/documents");
    mountDefaultPage();
    console.log("QueryClient cache before waits:", queryClient.getQueryCache().getAll());

    cy.wait("@getStaffUser").then((interception) => console.log("StaffUser intercepted:", interception));
    cy.wait("@getProjects").then((interception) => console.log("Projects intercepted:", interception));
    cy.wait("@getDocumentTypes").then((interception) => console.log("DocumentTypes intercepted:", interception));

  });
});
