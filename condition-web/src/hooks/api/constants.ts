export const defaultUseQueryOptions = {
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0,
};

export const QUERY_KEY = Object.freeze({
    SUBCONDITIONS: "subconditions",
    CONDITIONS: "conditions",
  });

export const HTTP_STATUS_CODES = {
    NOT_FOUND: 404,
    FORBIDDEN: 403,
    BAD_REQUEST: 400,
    CONFLICT: 409,
    PRECONDITION_FAILED: 412,
};
