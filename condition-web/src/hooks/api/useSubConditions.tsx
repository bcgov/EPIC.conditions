import { submitRequest } from "@/utils/axiosUtils";
import { useMutation } from "@tanstack/react-query";
import { Options } from "./types";

export const updateSubconditions = (subconditions: Array<{ subcondition_id: string; subcondition_identifier: string; subcondition_text: string }>) => {
  return submitRequest({
    url: `/subconditions`,
    method: "patch",
    data: subconditions,
  });
};

type UseUpdateSubconditionsParams = {
  subconditions: Array<{
    subcondition_id: string;
    subcondition_identifier: string;
    subcondition_text: string;
  }>;
  options?: Options;
};

export const useUpdateSubconditions = ({ subconditions, options }: UseUpdateSubconditionsParams) => {

  return useMutation({
    mutationFn: () => updateSubconditions(subconditions),
    ...options,
  });
};
