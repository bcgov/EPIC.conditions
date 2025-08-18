import { OidcConfig } from "../../../src/utils/config";

export const mockZustandStore = (storeModule, initialState) => {
  const storeResetFn = storeModule.getState().reset;

  storeModule.setState(initialState, true); // Reset the store state to initialState

  // Clean up the mock after each test
  return () => {
    storeResetFn();
  };
};

const TestJwt = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImUtYzVzRWxUZFduVjZRQ3Z0dmw3VllHV3F5Z3U4LVRDTm9kcm93VncyUWsifQ.eyJleHAiOjE3NTE2Njk5MjUsImlhdCI6MTc1MTY2NjMyNSwiYXV0aF90aW1lIjoxNzUxNjY2MzI1LCJqdGkiOiIiLCJpc3MiOiJodHRwczovL3Rlc3QtaXNzdWVyIiwiYXVkIjpbImVwaWMtc3VibWl0IiwiYWNjb3VudCJdLCJzdWIiOiJ0ZXN0LXN1YiIsInR5cCI6IkJlYXJlciIsImF6cCI6ImVwaWMtc3VibWl0Iiwic2lkIjoiIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6W10sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJlYW9fdmlldyJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImVwaWMtc3VibWl0Ijp7InJvbGVzIjpbImVhb19lZGl0IiwiZXh0ZW5kZWRfZWFvX2VkaXQiLCJlYW9fY3JlYXRlIiwiZWFvX3ZpZXciXX0sImFjY291bnQiOnsicm9sZXMiOlsidmlldy1wcm9maWxlIl19LCJlcGljLWNvbmRpdGlvbiI6eyJyb2xlcyI6WyJ2aWV3X2NvbmRpdGlvbnMiXX19LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwiaWRlbnRpdHlfcHJvdmlkZXIiOiJpZGlyIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJuYW1lIjoiRUFPIFRFU1QyIiwiZ3JvdXBzIjpbIi9TVUJNSVQvRUF PX01BTkFHRVIiXSwicHJlZmVycmVkX3VzZXJuYW1lIjoiQEBpZGlyIiwiZ2l2ZW5fbmFtZSI6IkVB TyIsImZhbWlseV9uYW1lIjoiVEVTVDIifQ.invalid-signature";

export const setupTokenStorage = () => {
  sessionStorage.setItem(
    `oidc.user:${OidcConfig.authority}:${OidcConfig.client_id}`,
    JSON.stringify({
      access_token: TestJwt,
      id_token: TestJwt,
      expires_in: 3600,
      scope: "openid profile",
      token_type: "Bearer",
      profile: {
        sub: "test-sub",
        name: "EAO TEST2",
        identity_provider: "idir",
      },
    }),
  );
};
