import { jwtDecode, JwtPayload } from "jwt-decode";
import { useAuth } from "react-oidc-context";
import { OidcConfig } from "@/utils/config";

// Enum-like object for role constants
export const KeycloakRoles = {
  VIEW_CONDITIONS: "view_conditions",
};

// Extend the JWT payload to include optional groups
interface ExtendedJwtPayload extends JwtPayload {
  resource_access?: Record<string, { roles: string[] }>;
}

// Hook to check if the current user has one of the allowed roles
export const useHasAllowedRoles = (requiredRoles: string[]): boolean => {
  const { user: authUser } = useAuth();

  if (!authUser?.access_token) return false;

  // Decode the JWT payload
  const { resource_access = {} } = jwtDecode<ExtendedJwtPayload>(authUser.access_token);

  // Get the client_id dynamically from OidcConfig
  const clientId = OidcConfig.client_id;

  // Check roles for the dynamic client_id
  const clientRoles = resource_access[clientId]?.roles ?? [];

  // Return true if the user has any of the required roles
  return requiredRoles.some((role) => clientRoles.includes(role));
};
