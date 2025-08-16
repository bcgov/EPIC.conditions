import { EPIC_CONDITION_ROLE } from "../../src/models/Role";

const base64Url = (obj: Record<string, unknown>) => {
  const json = JSON.stringify(obj);
  const base64 = btoa(json); // browser btoa
  return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
};

// Minimal dummy JWT
const dummyJWT = `${base64Url({ alg: "none", typ: "JWT" })}.${base64Url({
  sub: "test-sub",
  name: "Test User",
  exp: Math.floor(Date.now() / 1000) + 3600,
  resource_access: {
    "epic-condition": { roles: ["view_conditions"] },
  },
})}.`; // note trailing dot, empty signature


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
    access_token: dummyJWT,
    session_state: "mock_session_state",
    token_type: "Bearer",
    state: {},
    expires_in: 3600,
    scope: "openid profile",
    id_token: dummyJWT,
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
  /* eslint-disable @typescript-eslint/no-explicit-any */
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
  /* eslint-enable @typescript-eslint/no-explicit-any */
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

export const mockCategoryData = {
  document_category: "Certificate and Amendments",
  documents: [
    {
      document_id: "c668a5210cdd8a970fb42722",
      document_label: "Schedule B - Table of Conditions",
      is_latest_amendment_added: true,
      status: false,
      year_issued: 2014,
    },
    {
      document_id: "c668a5210cdd8a970fb42723",
      document_label: "Amendment 1",
      status: false,
      year_issued: 2022,
    },
    {
      document_id: "c668a5210cdd8a970fb42724",
      document_label: "Amendment #2",
      status: false,
      year_issued: 2025,
    },
  ],
  project_name: "Project Name",
};

export const mockDocument = {
  document_category: "Certificate and Amendments",
  document_category_id: "1",
  document_id: "c668a5210cdd8a970fb42722",
  document_label: "Schedule B - Table of Conditions",
  document_type_id: 1,
  project_name: "Project Name"
}

export const mockConditions = {
  conditions: [
    {
      amendment_names: "Amendment X",
      condition_attributes: {},
      condition_id: "999",
      condition_name: "Test Condition",
      condition_number: 1,
      condition_text: "This is a dummy condition for testing purposes.",
      is_approved: true,
      is_standard_condition: null,
      subconditions: [
        {
          sort_order: 1,
          subcondition_identifier: "",
          subcondition_text: "Dummy subcondition A",
          subconditions: [],
        },
        {
          sort_order: 2,
          subcondition_identifier: "",
          subcondition_text: "Dummy subcondition B",
          subconditions: [
            {
              sort_order: 3,
              subcondition_identifier: "",
              subcondition_text: "Nested dummy subcondition B.1",
              subconditions: [],
            },
          ],
        },
      ],
      subtopic_tags: ["Testing"],
      topic_tags: ["QA"],
      year_issued: 2025,
    },
  ],
};
