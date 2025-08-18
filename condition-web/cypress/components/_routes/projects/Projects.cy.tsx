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
import { QUERY_KEY } from "../../../../src/hooks/api/constants";

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

    cy.intercept(
      "GET",
      `/api/users/guid/${mockStaffUser.auth_guid}`,
      { body: mockStaffUser }
    ).as("getStaffUser");

    queryClient.clear();
  });

  it("renders projects from API", () => {
    cy.intercept("GET", `${AppConfig.apiUrl}/projects`, {
      body: mockProjects,
    }).as("getProjects");

    cy.intercept("GET", `${AppConfig.apiUrl}/documents/type`, {
      body: mockDocumentTypes,
    }).as("getDocumentTypes");

    queryClient.setQueryData([QUERY_KEY.PROJECTS], mockProjects);
    queryClient.setQueryData([QUERY_KEY.DOCUMENTTYPE], mockDocumentTypes);
    mountDefaultPage();

    cy.contains(mockProjects[0].project_name).should("exist");
    cy.contains(mockProjects[0].documents[0].document_category).should("exist");
  });
});
