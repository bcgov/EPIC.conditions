import { useMounted } from "@/hooks/common";
import { Paper, Container } from "@mui/material";
import { useAuth } from "react-oidc-context";

export default function ErrorPage() {
  const { signoutRedirect } = useAuth();

  useMounted(() => {
    signoutRedirect();
  });

  return (
    <Container id="Error">
      <Paper
        elevation={3}
        sx={{
          padding: "1rem",
          marginTop: "2rem",
          textAlign: "center",
        }}
      >
        <p>Oops! something wrong happened.</p>
        <p>You will be signed out.</p>
      </Paper>
    </Container>
  );
}
