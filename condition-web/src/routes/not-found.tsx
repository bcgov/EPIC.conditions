import { createFileRoute, useSearch } from "@tanstack/react-router";
import PageNotFound from "@/components/Shared/PageNotFound";

export const Route = createFileRoute("/not-found")({
  component: NotFound,
  validateSearch: (search: Record<string, unknown>) => ({
    message: typeof search.message === "string" ? search.message : "Page not found",
  }),
});

function NotFound() {
  const { message } = useSearch({ from: Route.id }); // Extract validated message
  return <PageNotFound errorMessage={message} />;
}
