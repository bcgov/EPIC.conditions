import { ThemeProvider } from "@mui/material";
import { QueryClient } from "@tanstack/query-core";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "react-oidc-context";
import { OidcConfig } from "@/utils/config";
import { theme } from "@/styles/theme";
import RouterProviderWithAuthContext from "@/router";
import ModalProvider from "./components/Shared/Modals/ModalProvider";
import SnackBarProvider from "./components/Shared/Snackbar/SnackBarProvider";
import LoaderBackdropProvider from "./components/Shared/Overlays/LoaderBackdropProvider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <ThemeProvider theme={theme}>
        <AuthProvider {...OidcConfig}>
          <ModalProvider />
          <SnackBarProvider />
          <LoaderBackdropProvider />
          <RouterProviderWithAuthContext />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
