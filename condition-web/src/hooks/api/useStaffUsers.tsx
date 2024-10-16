import { OnErrorType, OnSuccessType, submitRequest } from "@/utils/axiosUtils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { StaffUser } from "@/models/StaffUser";


type GetUserResponse = {
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
const getUserByGuid = (guid?: string) => {
  return submitRequest<GetUserResponse>({ url: `/users/guid/${guid}` });
};

export const useGetUserByGuid = ({ guid }: { guid?: string }) => {
  return useQuery({
    queryKey: ["user", guid],
    queryFn: () => getUserByGuid(guid),
    enabled: Boolean(guid),
    retry: false,
  });
};

const addStaffUser = (user: Omit<StaffUser, "id">) => {
  return submitRequest({ url: "/users", method: "post", data: user });
};

export const useAddStaffUser = (onSuccess: OnSuccessType, onError: OnErrorType) => {
  return useMutation({
    mutationFn: addStaffUser,
    onSuccess,
    onError,
  });
};
