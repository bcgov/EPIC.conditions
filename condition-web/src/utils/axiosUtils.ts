/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppConfig, OidcConfig } from "@/utils/config";
import axios, { AxiosError, AxiosInstance } from "axios";
import { User } from "oidc-client-ts";

export type OnErrorType = (error: AxiosError) => void;
export type OnSuccessType = (data: any) => void;

const submitClient = axios.create({ baseURL: AppConfig.apiUrl });

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
