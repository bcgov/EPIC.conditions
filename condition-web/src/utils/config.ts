import { WebStorageStateStore } from "oidc-client-ts";

declare global {
  interface Window {
    _env_: {
      VITE_API_URL: string;
      VITE_ENV: string;
      VITE_VERSION: string;
      VITE_APP_TITLE: string;
      VITE_APP_URL: string;
      VITE_OIDC_AUTHORITY: string;
      VITE_CLIENT_ID: string;
      VITE_SUPPORT_EMAIL: string;
    };
  }
}
const API_URL =
  window._env_?.VITE_API_URL || import.meta.env.VITE_API_URL || "";
const APP_ENVIRONMENT =
  window._env_?.VITE_ENV || import.meta.env.VITE_ENV || "";
const APP_VERSION =
  window._env_?.VITE_VERSION || import.meta.env.VITE_VERSION || "";
const APP_TITLE =
  window._env_?.VITE_APP_TITLE || import.meta.env.VITE_APP_TITLE || "";
const APP_URL = window._env_?.VITE_APP_URL || import.meta.env.VITE_APP_URL;
const OIDC_AUTHORITY =
  window._env_?.VITE_OIDC_AUTHORITY || import.meta.env.VITE_OIDC_AUTHORITY;
const CLIENT_ID =
  window._env_?.VITE_CLIENT_ID || import.meta.env.VITE_CLIENT_ID;
const SUPPORT_EMAIL =
  window._env_?.VITE_SUPPORT_EMAIL || import.meta.env.VITE_SUPPORT_EMAIL;

export const AppConfig = {
  apiUrl: `${API_URL}`,
  environment: APP_ENVIRONMENT,
  version: APP_VERSION,
  appTitle: APP_TITLE,
  appUrl: APP_URL,
  clientId: CLIENT_ID,
  supportEmail: SUPPORT_EMAIL,
};

export const OidcConfig = {
  authority: OIDC_AUTHORITY,
  kc_idp_hint: "idir",
  client_id: CLIENT_ID,
  redirect_uri: `${APP_URL}/oidc-callback`,
  post_logout_redirect_uri: `${APP_URL}/`,
  scope: "openid profile email",
  revokeTokensOnSignout: true,
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
};
