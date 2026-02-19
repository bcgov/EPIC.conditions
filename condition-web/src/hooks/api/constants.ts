export const defaultUseQueryOptions = {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
    retry: false,
};

export const QUERY_KEY = Object.freeze({
    ATTRIBUTEKEYS: "attribute-keys",
    PROJECTS: "projects",
    AVAILABLE_PROJECTS: "available-projects",
    DOCUMENT: "documents",
    AVAILABLE_DOCUMENTS: "available-documents",
    DOCUMENTDETAIL: "document-details",
    PROJECTDOCUMENT: "project-documents",
    DOCUMENTTYPE: "document-type",
    SUBCONDITIONS: "subconditions",
    CONDITIONS: "conditions",
    CONDITION: "condition",
    CONDITIONSDETAIL: "condition-details",
    CONSOLIDATEDCONDITIONS: "consolidated-conditions",
    USERS: "users"
  });

export const HTTP_STATUS_CODES = {
    NOT_FOUND: 404,
    FORBIDDEN: 403,
    BAD_REQUEST: 400,
    CONFLICT: 409,
    PRECONDITION_FAILED: 412,
};
