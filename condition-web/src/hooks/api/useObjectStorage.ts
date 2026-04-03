import { documentRequest, requestAxios } from "@/utils/axiosUtils";
import { useMutation } from "@tanstack/react-query";

export const S3_FOLDER = {
    CONDITION_DOCUMENTS: {
        value: "condition_documents",
        label: "Condition Documents",
    }
};

type AuthHeaderRequestData = {
    filename: string;
    s3sourceuri?: string;
    folder?: string;
};

enum PresignedUrlAction {
    GET = "GET",
    PUT = "PUT",
    DELETE = "DELETE",
}

type PresignedUrlRequestPayload = {
    relative_url?: string;
    action?: string;
};

const fetchPresignedUrl = async (requestPayload: PresignedUrlRequestPayload) => {
    const response = await documentRequest({
        url: "/storage-operations/presigned-urls",
        params: { "public-read": false },
        method: "post",
        data: requestPayload,
    });

    if (!response?.presigned_url) {
        throw new Error("Failed to fetch pre-signed URL");
    }

    return response;
};

const uploadObject = (presignedUrl: string, file: File) => {
    return requestAxios({
        url: presignedUrl,
        method: "put",
        data: file,
        headers: {
            "Content-Type": "application/octet-stream",
        },
    });
};

// Save an object to S3
export const saveObject = async ({
    file,
    fileDetails,
}: {
    file: File;
    fileDetails: AuthHeaderRequestData;
}) => {
    const presignedUrlData = await fetchPresignedUrl({
        relative_url: `${fileDetails.folder}/${file.name}`,
        action: PresignedUrlAction.PUT,
    });

    await uploadObject(presignedUrlData.presigned_url, file);
    return Promise.resolve(presignedUrlData.relative_url);
};

const getObject = (presignedUrl: string) => {
    return requestAxios({
        url: presignedUrl,
        method: "get",
        responseType: "blob",
    });
};

// Download an object from S3
export const downloadObject = async (file: AuthHeaderRequestData) => {
    const presignedUrlData = await fetchPresignedUrl({
        relative_url: file.s3sourceuri,
        action: PresignedUrlAction.GET,
    });

    return getObject(presignedUrlData.presigned_url);
};

// Delete an object from S3
type DeleteDocumentProps = {
    filepath: string;
};
export const deleteDocument = async (data: DeleteDocumentProps) => {
    const presignedUrlData = await fetchPresignedUrl({
        relative_url: data.filepath,
        action: PresignedUrlAction.DELETE,
    });

    return requestAxios({
        url: presignedUrlData.presigned_url,
        method: "delete",
    });
};

type CopyObjectResponse = {
    message: string;
    status: "success" | "error";
    document: {
        name: string;
        unique_name: string;
        path: string;
        project_id: number | null;
    };
    new_relative_url?: string;
};

export const copyObject = async ({
    relativeUrl,
    destinationFolder,
    filename,
}: {
    relativeUrl: string;
    destinationFolder: string;
    filename: string;
}) => {
    return documentRequest<CopyObjectResponse>({
        url: "/storage-operations/objects",
        method: "post",
        headers: {
            "Content-Type": "application/json",
        },
        data: {
            action: "copy",
            relative_url: relativeUrl,
            destination_folder: destinationFolder,
            filename: filename,
        },
    });
};

export const useUploadDocument = () =>
    useMutation({
        mutationFn: ({ file, folder }: { file: File; folder: string }) =>
            saveObject({ file, fileDetails: { filename: file.name, folder } }),
    });
