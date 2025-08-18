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
