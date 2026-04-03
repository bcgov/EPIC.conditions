import { submitRequest } from "@/utils/axiosUtils";
import { useMutation } from "@tanstack/react-query";

export interface CreateExtractionRequestPayload {
    project_id: string;
    document_id?: string | null;
    document_type_id?: number | null;
    document_label?: string | null;
    s3_url: string;
}

const createExtractionRequest = (payload: CreateExtractionRequestPayload) => {
    return submitRequest({
        url: "/extraction-requests",
        method: "post",
        data: payload,
    });
};

export const useCreateExtractionRequest = () =>
    useMutation({
        mutationFn: (payload: CreateExtractionRequestPayload) => createExtractionRequest(payload),
    });
