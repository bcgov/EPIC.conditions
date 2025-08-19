import { mount } from "cypress/react18";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "react-oidc-context";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { AppConfig } from "../../../../src/utils/config";
import { routeTree } from "../../../../src/routeTree.gen";
import { mockAuth, setupTokenStorage } from "../../../utils/testUtils";
import {
    mockAuthentication,
    mockCategoryData,
    mockProjects,
    mockDocumentTypes,
    mockDocument,
    mockConditions,
    mockStaffUser,
    mockCreatedCondition,
} from "../../../utils/mockConstants";
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "../../../../src/styles/theme";

describe("conditions page", () => {
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
          <AuthContext.Provider value={mockAuth}>
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

  it("renders conditions from API", () => {
    cy.intercept("GET", `${AppConfig.apiUrl}/projects`, {
      body: mockProjects,
    }).as("getProjects");

    cy.intercept("GET", `${AppConfig.apiUrl}/documents/type`, {
      body: mockDocumentTypes,
    }).as("getDocumentTypes");

    cy.intercept("GET", `${AppConfig.apiUrl}/document-category/project/c668a5210cdd8a970fb42722/category/1`, {
        body: mockCategoryData,
    }).as("getDocumentCategory");

    cy.intercept("GET", `${AppConfig.apiUrl}/documents/c668a5210cdd8a970fb42722`, {
        body: mockDocument,
    }).as("getDocument");

    cy.intercept("GET", `${AppConfig.apiUrl}/conditions/project/c668a5210cdd8a970fb42722/document/c668a5210cdd8a970fb42722?include_subconditions=false`, {
        body: mockConditions,
    }).as("getConditions");

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
    cy.contains("Schedule B - Table of Conditions").click();

    // Wait for API response
    cy.wait("@getDocument");
    cy.wait("@getConditions");

    // Assert URL contains expected project/category path
    cy.url().should(
      "include",
      "/conditions/project/c668a5210cdd8a970fb42722/document/c668a5210cdd8a970fb42722"
    );

    // Assert that the mock documents are displayed
    cy.contains("Test Condition").should("exist");
  });

  it("adds a condition when 'Add Condition' button is clicked", () => {
    cy.intercept("GET", `${AppConfig.apiUrl}/projects`, {
    body: mockProjects,
    }).as("getProjects");

    cy.intercept("GET", `${AppConfig.apiUrl}/documents/type`, {
    body: mockDocumentTypes,
    }).as("getDocumentTypes");

    cy.intercept("GET", `${AppConfig.apiUrl}/document-category/project/c668a5210cdd8a970fb42722/category/1`, {
        body: mockCategoryData,
    }).as("getDocumentCategory");

    cy.intercept("GET", `${AppConfig.apiUrl}/documents/c668a5210cdd8a970fb42722`, {
        body: mockDocument,
    }).as("getDocument");

    cy.intercept("GET", `${AppConfig.apiUrl}/conditions/project/c668a5210cdd8a970fb42722/document/c668a5210cdd8a970fb42722?include_subconditions=false`, {
        body: mockConditions,
    }).as("getConditions");

    // Intercept the POST request for adding a condition
    cy.intercept(
      "POST",
      `${AppConfig.apiUrl}/conditions/project/c668a5210cdd8a970fb42722/document/c668a5210cdd8a970fb42722?allow_duplicate_condition=false`,
      {
        statusCode: 200,
        body: { condition_id: 522 },
      }
    ).as("addCondition");

    cy.intercept("GET", `${AppConfig.apiUrl}/conditions/522`, {
        statusCode: 200,
        body: mockCreatedCondition,
    }).as("getCreatedCondition");

    mountDefaultPage();
  
    // Navigate to the conditions page as before
    cy.contains("Certificate and Amendments").click();
    cy.wait("@getDocumentCategory");
    cy.contains("Schedule B - Table of Conditions").click();
    cy.wait("@getDocument");
    cy.wait("@getConditions");
  
    // Click the "Add Condition" button
    cy.contains("Add Condition").click();
  
    // Wait for the POST request to be called
    cy.wait("@addCondition");
    cy.wait("@getCreatedCondition");
  
    // Assert that the page navigated to the create condition route
    cy.url().should("include", "/conditions/create/522");

    // Assert that the resulting page contains expected fields
    cy.contains("Condition Number").should("exist");
    cy.contains(mockProjects[0].project_name).should("exist");
  });  
});
