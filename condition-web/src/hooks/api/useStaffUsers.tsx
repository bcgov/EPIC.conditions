import { OnErrorType, OnSuccessType, submitRequest } from "@/utils/axiosUtils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { StaffUserModel } from "@/models/StaffUser";
import { defaultUseQueryOptions, QUERY_KEY } from "./constants";


type FetchUserResponse = {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  work_contact_number: string;
  work_email_address: string;
  auth_guid: string;
  created_date: string;
  updated_date: string;
};
const fetchUserByGuid = (guid?: string) => {
  return submitRequest<FetchUserResponse>({ url: `/users/guid/${guid}` });
};

export const useGetUserByGuid = ({ guid }: { guid?: string }) => {
  return useQuery({
    queryKey: [QUERY_KEY.USERS, guid],
    queryFn: () => fetchUserByGuid(guid),
    enabled: Boolean(guid),
    ...defaultUseQueryOptions,
  });
};

const addStaffUser = (user: Omit<StaffUserModel, "id">) => {
  return submitRequest({ url: "/users", method: "post", data: user });
};

export const useAddStaffUser = (onSuccess: OnSuccessType, onError: OnErrorType) => {
  return useMutation({
    mutationFn: addStaffUser,
    onSuccess,
    onError,
  });
};
