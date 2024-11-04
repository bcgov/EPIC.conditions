export const defaultUseQueryOptions = {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
};

export const QUERY_KEY = Object.freeze({
    SUBCONDITIONS: "subconditions",
    CONDITIONS: "conditions",
  });
