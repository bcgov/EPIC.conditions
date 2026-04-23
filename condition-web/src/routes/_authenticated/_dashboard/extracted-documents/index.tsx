import { createFileRoute } from "@tanstack/react-router";
import ExtractedDocumentsPage from "@/components/ExtractedDocuments/ExtractedDocumentsPage";

export const Route = createFileRoute(
  "/_authenticated/_dashboard/extracted-documents/"
)({
  component: ExtractedDocumentsPage,
  meta: () => [
    { title: "Home", path: "/projects" },
    { title: "Extracted Documents", path: "/extracted-documents" },
  ],
});
