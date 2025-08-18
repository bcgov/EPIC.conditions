import { mount } from "cypress/react18";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "react-oidc-context";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { AppConfig, OidcConfig } from "../../../../src/utils/config";
import { routeTree } from "../../../../src/routeTree.gen";
import { setupTokenStorage } from "../../../utils/testUtils";
import {
  mockAuthentication,
  mockStaffUser,
  mockProjects,
  mockDocumentTypes
} from "../../../utils/mockConstants";

// Helper to encode object to base64url
const base64Url = (obj: Record<string, unknown>) => {
  const json = JSON.stringify(obj);
  const base64 = btoa(json);
  return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
};
  
// Create dummy JWT
const payload = {
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
  sub: "test-sub",
  resource_access: {
    [OidcConfig.client_id]: {
      roles: ["view_conditions"], // required role
    },
  },
};
  
const mockAccessToken = `${base64Url({ alg: "RS256", typ: "JWT" })}.${base64Url(
  payload
)}.signature`;
  
export const mockAuth = {
  isAuthenticated: true,
  user: {
    profile: {
      name: "Test User",
      identity_provider: "idir",
      sub: "test-sub",
    },
    access_token: mockAccessToken,
    id_token: "mock_id_token",
    session_state: "mock_session_state",
    token_type: "Bearer",
    expires_in: 3600,
    toStorageString: () => "",
  },
  signoutRedirect: () => Promise.resolve(),
  signinRedirect: () => Promise.resolve(),
  isLoading: false,
  settings: {
    authority: "https://test-issuer",
    client_id: OidcConfig.client_id,
    redirect_uri: "http://localhost/callback",
  },
  events: {} as Record<string, (...args: unknown[]) => void>, 
};
  


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
});