import { mount } from "cypress/react18";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "../../../../src/routeTree.gen";
import {
    mockAuthentication,
    mockCategoryData,
    mockStaffUser,
    mockProjects,
    mockDocumentTypes
} from "../../../utils/mockConstants";
import { setupTokenStorage } from "../../utils";
import { OidcConfig } from "../../../../src/utils/config";
import { AuthProvider } from "react-oidc-context";

describe("documents page", () => {
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

    router.navigate({ to: `/projects` });

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
    cy.intercept("GET", `/api/projects`, { body: mockProjects }).as(
      "getProjects"
    );

    cy.intercept("GET", `/api/documents/type`, { body: mockDocumentTypes }).as(
      "getDocumentTypes"
    );

    cy.intercept("GET", `/api/document-category/project/c668a5210cdd8a970fb42722/category/1`, { body: mockCategoryData }).as(
      "getDocumentCategory"
    );

    mountDefaultPage();

    // Click the "Certificate and Amendments" item
    cy.contains("Certificate and Amendments").click();

    // Wait for API response
    cy.wait("@getDocumentCategory");

    // Assert URL contains expected project/category path
    cy.url().should(
      "include",
      "/documents/project/c668a5210cdd8a970fb42722/document-category/1"
    );

    // Assert that the mock documents are displayed
    cy.contains("Schedule B - Table of Conditions").should("exist");
    cy.contains("Amendment 1").should("exist");
    cy.contains("Amendment #2").should("exist");
  });
});
