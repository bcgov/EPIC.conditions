// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Options<TData = any> = {
  onSuccess?: (data?: TData) => void;
  onError?: () => void;
  onSettled?: (data?: TData) => void;
};
