import ErrorPage from "@/components/ErrorPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/error")({
  component: Error,
  meta: () => [{ title: "Error" }],
});

function Error() {
  return <ErrorPage />;
}
