import { OidcConfig } from "../../src/utils/config";

export const mockZustandStore = (storeModule, initialState) => {
  const storeResetFn = storeModule.getState().reset;

  storeModule.setState(initialState, true); // Reset the store state to initialState

  // Clean up the mock after each test
  return () => {
    storeResetFn();
  };
};

export const setupTokenStorage = () => {
  sessionStorage.setItem(
    `oidc.user:${OidcConfig.authority}:${OidcConfig.client_id}`,
    JSON.stringify({
      access_token:
        "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJleHAiOjE3NTE2Njk5MjUsImlhdCI6MTc1MTY2NjMyNSwiYXV0aF90aW1lIjoxNzUxNjY2MzI1LCJqdGkiOiIiLCJpc3MiOiJodHRwczovL3Rlc3QtaXNzdWVyIiwiYXVkIjpbImVwaWMtY29uZGl0aW9uIiwiYWNjb3VudCJdLCJzdWIiOiJ0ZXN0LXN1YiIsInR5cCI6IkJlYXJlciIsImF6cCI6ImVwaWMtY29uZGl0aW9uIiwic2lkIjoiIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6W10sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJlYW9fdmlldyJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImVwaWMtY29uZGl0aW9uIjp7InJvbGVzIjpbInZpZXdfY29uZGl0aW9ucyJdfX0sInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJpZGVudGl0eV9wcm92aWRlciI6ImlkaXIiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm5hbWUiOiJFQU8gVEVTVDIiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJAYWRpciIsImdpdmVuX25hbWUiOiJFQU8iLCJmYW1pbHlfbmFtZSI6IlRFU1QyIn0.",
    }),
  );
};


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
