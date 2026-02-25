import { mount } from "cypress/react18";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "react-oidc-context";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { AppConfig } from "../../../../src/utils/config";
import { routeTree } from "../../../../src/routeTree.gen";
import { mockAuth, setupTokenStorage } from "../../../utils/testUtils";
import {
  mockAuthentication,
  mockStaffUser,
  mockProjects,
  mockDocumentTypes,
  mockConditions
} from "../../../utils/mockConstants";
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "../../../../src/styles/theme";

describe("projects page", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const mountDefaultPage = () => {
    const router = createRouter({
      routeTree,
      context: { authentication: mockAuth },
    });

    router.navigate({ to: `/projects` });

    mount(
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={mockAuthentication}>
            <RouterProvider
              router={router}
              context={{
                authentication: mockAuthentication,
              }}
            />
          </AuthContext.Provider>
        </QueryClientProvider>
      </ThemeProvider>
      );
  };

  beforeEach(() => {
    cy.viewport(1280, 800);
    setupTokenStorage();

    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/users/guid/${mockStaffUser.auth_guid}`,
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
    mountDefaultPage();

    cy.contains(mockProjects[0].project_name).should("exist");
    cy.contains(mockProjects[0].documents[0].document_category).should("exist");
  });

  it("opens Add Document modal and selects a project", () => {
    cy.intercept("GET", `${AppConfig.apiUrl}/projects`, {
      body: mockProjects,
    }).as("getProjects");

    cy.intercept("GET", `${AppConfig.apiUrl}/documents/type`, {
      body: mockDocumentTypes,
    }).as("getDocumentTypes");

    mountDefaultPage();

    // Click the "+ Add Document" button
    cy.contains("Add Document").click();

    // Assert modal is visible with label
    cy.contains("Add Document").should("exist");

    // Open project selector dropdown
    cy.get('[data-testid="project-selector-input"]').click();

    // Select option from dropdown
    cy.get('li[role="option"]').contains('Project Name').click();
  });

  it("navigates to consolidated conditions when clicking View Consolidated Conditions", () => {
    cy.intercept("GET", `${AppConfig.apiUrl}/projects`, {
      body: mockProjects,
    }).as("getProjects");

    cy.intercept("GET", `${AppConfig.apiUrl}/documents/type`, {
      body: mockDocumentTypes,
    }).as("getDocumentTypes");

    // ✅ Intercept consolidated conditions API
    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/conditions/project/c668a5210cdd8a970fb42722?all_conditions=true&category_id=`,
      { body: mockConditions }
    ).as("getConsolidatedConditions");

    mountDefaultPage();

    // Click the "View Consolidated Conditions" button
    cy.contains("View Consolidated Conditions").click();

    // Wait for API call
    cy.wait("@getConsolidatedConditions");

    // Assert navigation
    cy.url().should(
      "include",
      "/projects/c668a5210cdd8a970fb42722/consolidated-conditions"
    );

    // Assert that mock conditions data rendered
    cy.contains("Test Condition").should("exist"); // adjust key text from mockConditions
  });
});