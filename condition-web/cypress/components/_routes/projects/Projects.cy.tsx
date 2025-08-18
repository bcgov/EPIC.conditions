import { mount } from "cypress/react18";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "react-oidc-context";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "../../../../src/routeTree.gen";
import { setupTokenStorage } from "../../../utils/testUtils";
import { mockAuthentication, mockProjects, mockDocumentTypes } from "../../../utils/mockConstants";
import { Projects } from "../../../../src/components/Projects";

describe("projects page", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const mountDefaultPage = () => {
    const router = createRouter({
      routeTree,
      context: { authentication: mockAuthentication },
    });

    router.navigate({ to: `/projects` });

    mount(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={mockAuthentication}>
          <Projects projects={mockProjects} documentType={mockDocumentTypes} />
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    cy.viewport(1280, 800);
    setupTokenStorage();
    queryClient.clear();
  });

  it("renders projects from API", () => {
    cy.intercept("GET", `/api/projects`, { body: mockProjects }).as(
      "getProjects"
    );

    cy.intercept("GET", `/api/documents/type`, { body: mockDocumentTypes }).as(
      "getDocumentTypes"
    );

    mountDefaultPage();

    cy.contains(mockProjects[0].project_name).should("exist");
    cy.contains(mockProjects[0].documents[0].document_category).should("exist");
  });
});
