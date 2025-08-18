import { EPIC_CONDITION_ROLE } from "../../src/models/Role";
import { OidcConfig } from "../../src/utils/config";
import { Buffer } from "buffer";

function base64UrlEncode(obj: Record<string, unknown>): string {
  const json = JSON.stringify(obj);
  return Buffer.from(json)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function createMockJwt(payload: Record<string, unknown>): string {
  const header = { alg: "RS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const signature = "testsignature"; // doesn't matter for tests
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Create dummy JWT
const payload = {
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
  sub: "test-sub",
  resource_access: {
    [OidcConfig.client_id]: {
      roles: ["view_conditions"],
    },
  },
};

const mockAccessToken = createMockJwt(payload);

export const mockAuthentication = {
  isAuthenticated: true,
  user: {
    profile: {
      name: "Test User",
      identity_provider: "idir",
      sub: "test-sub",
    },
    access_token: mockAccessToken,
    id_token: mockAccessToken,
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
