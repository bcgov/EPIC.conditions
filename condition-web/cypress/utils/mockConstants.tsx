import { EPIC_CONDITION_ROLE } from "../../src/models/Role";

export const mockAuthentication = {
  isAuthenticated: true,
  user: {
    profile: {
      name: "Test User",
      identity_provider: "idir",
      sub: "test-sub",
      iss: "https://test-issuer",
      aud: "test-audience",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    },
    access_token: "test_access_token",
    session_state: "mock_session_state",
    token_type: "Bearer",
    state: {},
    expires_in: 3600,
    scope: "openid profile",
    id_token: "mock_id_token",
    refresh_token: "mock_refresh_token",
    expired: false,
    scopes: ["openid", "profile"],
    toStorageString: () => "",
  },
  signoutRedirect: () => Promise.resolve(),
  signinRedirect: () => Promise.resolve(),
  isLoading: false,
  // Mock required AuthContextProps properties
  settings: {
    authority: "https://test-issuer",
    client_id: "test-client-id",
    redirect_uri: "http://localhost/callback",
  },
  events: {} as any,
  clearStaleState: () => Promise.resolve(),
  removeUser: () => Promise.resolve(),
  signoutSilent: () => Promise.resolve(),
  signinSilent: () => Promise.resolve(null),
  signinPopup: () =>
    Promise.resolve({
      profile: { name: "Test User", identity_provider: "idir" },
      expired: false,
      scopes: ["openid", "profile"],
      toStorageString: () => "",
    } as any),
  signoutPopup: () => Promise.resolve(),
  startSilentRenew: () => Promise.resolve(),
  stopSilentRenew: () => Promise.resolve(),
  error: undefined,
  // Add missing AuthContextProps properties
  signinResourceOwnerCredentials: () =>
    Promise.resolve({
      profile: { name: "Test User", identity_provider: "idir" },
      expired: false,
      scopes: ["openid", "profile"],
      toStorageString: () => "",
    } as any),
  querySessionStatus: () => Promise.resolve(null),
  revokeTokens: () => Promise.resolve(),
};

export const mockStaffAccount = {
  isLoading: false,
  roles: [
    EPIC_CONDITION_ROLE.view_conditions,
  ],
};

export const mockProjects = [
  {
    documents: [
      {
        amendment_count: 1,
        date_issued: "2024-01-11",
        document_category: "Certificate and Amendments",
        document_category_id: "1",
        document_types: ["Certificate"],
        is_latest_amendment_added: true,
        status: false,
      },
    ],
    project_id: "c668a5210cdd8a970fb42722",
    project_name: "Project Name",
  },
];

export const mockDocumentTypes = [
  { document_category_id: 1, document_type: "Certificate", id: 1 },
  { document_category_id: 2, document_type: "Exemption Order", id: 2 },
  { document_category_id: 1, document_type: "Amendment", id: 3 },
  { document_category_id: 3, document_type: "Other Order", id: 4 },
];
