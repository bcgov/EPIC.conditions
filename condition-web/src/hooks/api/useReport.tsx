import { ReportModel, ReportSubmissionModel } from "@/models/ConditionAttribute";
import { submitRequest } from "@/utils/axiosUtils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { defaultUseQueryOptions } from "./constants";
import { Options } from "./types";

const REPORTS_KEY = "reports";

const fetchReports = (conditionId: number) =>
  submitRequest<ReportModel[]>({ url: `/reports/condition/${conditionId}` });

export const useGetReports = (conditionId?: number) =>
  useQuery({
    queryKey: [REPORTS_KEY, conditionId],
    queryFn: () => fetchReports(conditionId!),
    enabled: Boolean(conditionId),
    ...defaultUseQueryOptions,
    refetchOnMount: true,
  });

export const useCreateReport = (conditionId?: number, options?: Options) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ReportModel> & { submissions: Array<{ phases: string[]; frequency: string; timing: string }> }) => {
      if (!conditionId) return Promise.reject(new Error("Condition ID is required"));
      return submitRequest<ReportModel>({
        url: `/reports/condition/${conditionId}`,
        method: "post",
        data: payload,
      });
    },
    onSuccess: () => queryClient.removeQueries({ queryKey: [REPORTS_KEY, conditionId] }),
    ...options,
  });
};

export const usePatchReport = (options?: Options) => {
  return useMutation({
    mutationFn: ({ reportId, payload }: { reportId: number; payload: Partial<ReportModel> }) =>
      submitRequest<ReportModel>({
        url: `/reports/${reportId}`,
        method: "patch",
        data: payload,
      }),
    ...options,
  });
};

export const useRemoveReport = (conditionId?: number, options?: Options) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportId: number) =>
      submitRequest({ url: `/reports/${reportId}`, method: "delete" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [REPORTS_KEY, conditionId] }),
    ...options,
  });
};

export const useAddReportSubmission = (conditionId?: number, options?: Options) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, payload }: { reportId: number; payload: { phases: string[]; frequency: string; timing: string } }) =>
      submitRequest<ReportSubmissionModel[]>({
        url: `/reports/${reportId}/submissions`,
        method: "post",
        data: payload,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [REPORTS_KEY, conditionId] }),
    ...options,
  });
};

export const usePatchReportSubmission = (conditionId?: number, options?: Options) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, payload }: { submissionId: number; payload: Partial<ReportSubmissionModel> }) =>
      submitRequest<ReportSubmissionModel>({
        url: `/reports/submissions/${submissionId}`,
        method: "patch",
        data: payload,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [REPORTS_KEY, conditionId] }),
    ...options,
  });
};

export const useRemoveReportSubmission = (conditionId?: number, options?: Options) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (submissionId: number) =>
      submitRequest({ url: `/reports/submissions/${submissionId}`, method: "delete" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [REPORTS_KEY, conditionId] }),
    ...options,
  });
};
