/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppConfig, OidcConfig } from "@/utils/config";
import axios, { AxiosError, AxiosInstance } from "axios";
import { User } from "oidc-client-ts";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";

export type OnErrorType = (error: AxiosError) => void;
export type OnSuccessType = (data: any) => void;

const submitClient = axios.create({ baseURL: AppConfig.apiUrl });
const documentClient = axios.create({ baseURL: AppConfig.documentUrl });
const axiosClient = axios.create();

function getUser() {
  const oidcStorage = sessionStorage.getItem(
    `oidc.user:${OidcConfig.authority}:${OidcConfig.client_id}`,
  );
  if (!oidcStorage) {
    return null;
  }

  return User.fromStorageString(oidcStorage);
}

const getAuthToken = () => {
  const user = getUser();
  if (user?.access_token) {
    return user.access_token;
  }
  throw new Error("No access token");
};

const setAuthToken = (client: AxiosInstance) => {
  const authToken = getAuthToken();

  client.defaults.headers.common.Authorization = `Bearer ${authToken}`;
};

export const submitRequest = async <T = any>({ ...options }) => {
  setAuthToken(submitClient);

  const response = await submitClient.request<T>(options);
  return response.data;
};

type OSSRequestOptions = {
  amzDate: string;
  authHeader: string;
};
export const OSSGetRequest = <T>(
  url: string,
  requestOptions: OSSRequestOptions,
) => {
  return axios.get<T>(url, {
    headers: {
      "X-Amz-Date": requestOptions.amzDate,
      Authorization: requestOptions.authHeader,
    },
    responseType: "blob",
  });
};

export const OSSPutRequest = <T>(
  url: string,
  data: File,
  requestOptions: OSSRequestOptions,
) => {
  return axios.put<T>(url, data, {
    headers: {
      "X-Amz-Date": requestOptions.amzDate,
      Authorization: requestOptions.authHeader,
    },
  });
};

export const documentRequest = async <T = any>({ ...options }) => {
  setAuthToken(documentClient);

  const response = await documentClient.request<T>(options);
  return response.data;
};

type ErrorResponseData = {
  message: string;
};

export const requestAxios = async ({ ...options }) => {
  try {
    const response = await axiosClient(options);
    return response?.data ?? response.data;
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      throw new Error("Unexpected error occurred!");
    }

    if (!error.response) {
      notify.error("Network error or CORS issue");
      throw new Error("Network error or CORS issue");
    } else {
      notify.error(
        (error.response?.data as ErrorResponseData)?.message ??
          error.message ??
          "API Error!",
      );
    }
    throw error;
  }
};
