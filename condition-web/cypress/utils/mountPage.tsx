import { mount } from "cypress/react18";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "react-oidc-context";
import { RouterProvider } from "@tanstack/react-router";
import { OidcConfig } from "../../src/utils/config";
import { mockAuthentication, mockStaffAccount } from "./mockConstants";
import { EpicConditionRole } from "../../src/models/Role";

type MountPageProps = {
  queryClient: QueryClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router: any;
  roles?: EpicConditionRole[];
  prepareAccount?: (roles: EpicConditionRole[]) => void;
  mockAccount?: Record<string, unknown>;
};

export const mountPage = ({
  queryClient,
  router,
  roles = [],
  prepareAccount,
  mockAccount = mockStaffAccount,
}: MountPageProps) => {
  if (prepareAccount) {
    prepareAccount(roles);
  }

  mount(
    <QueryClientProvider client={queryClient}>
      <AuthProvider {...OidcConfig}>
        <RouterProvider
          router={router}
          context={{
            authentication: mockAuthentication,
            account: mockAccount,
          }}
        />
      </AuthProvider>
    </QueryClientProvider>,
  );
};
