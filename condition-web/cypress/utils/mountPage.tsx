import { mount } from "cypress/react18";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "react-oidc-context";
import { RouterProvider } from "@tanstack/react-router";
import { OidcConfig } from "../../src/utils/config";
import { mockAuthentication, mockStaffAccount } from "./mockConstants";
import { EpicConditionRole } from "../../src/models/Role";

type MountPageProps = {
  queryClient: any;
  router: any;
  roles?: EpicConditionRole[];
  prepareAccount?: (roles: any) => void;
  mockAccount?: any;
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
