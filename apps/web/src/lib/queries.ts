import { useMutation, useQuery } from "@tanstack/react-query";
import { SITE_CONFIG } from "./constants";
import init, {
  TsbinController,
  UploadProgress as WasmUploadProgress,
} from "tsbin-wasm";
import { sendTrash } from "./apis";

type TrashType = "TEXT" | "FILE";

export type TrashData = {
  expireAt: Date | null;
  slug: string;
  id: string;
  type: TrashType;
  badReport: number;
  encrypted: boolean;
  createdAt: Date;
  objectId: string;
};

export type UploadProgressData = {
  percentage: number;
  uploadedChunks: number;
  totalChunks: number;
  failedChunks: number[];
  completed: boolean;
};

export const useTrash = (id: string) =>
  useQuery({
    queryKey: ["trash", id],
    queryFn: async () => {
      const res = await fetch(`${SITE_CONFIG.API_URL}/trash/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch trash data");
      }
      const data = await res.json();
      return data.data as TrashData;
    },
  });

export type TextTrashContent = {
  id: string;
  enc_trash_text: string;
  encryption_type: string;
  text_length: number;
};

export const useTextTrashContent = () =>
  useMutation({
    retry(_, error) {
      if (
        error instanceof Error &&
        error.message.includes("Missing id or passcode")
      ) {
        return true;
      }
      return false;
    },

    mutationFn: async ({ id, passcode }: { id: string; passcode: string }) => {
      try {
        if (!id || !passcode) {
          throw new Error("Missing id or passcode");
        }

        await init();
        const ts = new TsbinController(SITE_CONFIG.API_URL, "");
        const obj = await ts.decrypt_text(id, passcode);
        return {
          id: obj.id,
          enc_trash_text: obj.enc_trash_text,
          encryption_type: obj.encryption_type,
          text_length: obj.text_length,
        } as TextTrashContent;
      } catch (error: any) {
        console.error("Error in useTextTrashContent:", error.message);
        throw new Error(error.message);
      }
    },
  });

export type FileTrashContent = {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  downloadUrl?: string;
  previewUrl?: string;
  fileData?: any;
};

export const useFileTrashContent = (
  onProgress?: (progress: {
    percentage: number;
    uploadedChunks: number;
    totalChunks: number;
    failedChunks: number[];
  }) => void
) =>
  useMutation({
    retry(_, error) {
      if (
        error instanceof Error &&
        error.message.includes("Missing id or passcode")
      ) {
        return true;
      }
      return false;
    },

    mutationFn: async ({ id, passcode }: { id: string; passcode: string }) => {
      try {
        if (!id || !passcode) {
          throw new Error("Missing id or passcode");
        }

        await init();
        const ts = new TsbinController(SITE_CONFIG.API_URL, "");

        // returns buffer
        const obj = await ts.decrypt_file(
          id,
          passcode,
          (progress: WasmUploadProgress) => {
            console.log(`Decryption progress:`, progress);
            // Calculate percentage from progress data
            const percentage =
              progress.total_chunks > 0
                ? Math.round(
                    (progress.uploaded_chunks / progress.total_chunks) * 100
                  )
                : 0;

            onProgress?.({
              percentage,
              uploadedChunks: progress.uploaded_chunks,
              totalChunks: progress.total_chunks,
              failedChunks: Array.from(progress.failed_chunks),
            });
          }
        );

        const arrayBuffer = obj.file.buffer as ArrayBuffer;
        const blob = new Blob([arrayBuffer], {
          type: "application/octet-stream",
        });

        return {
          id: id,
          fileName: obj.file_name,
          fileSize: obj.file_size.toString(),
          fileType: obj.mime_type,
          downloadUrl: URL.createObjectURL(blob),
          fileData: arrayBuffer,
        } as FileTrashContent;
      } catch (error: any) {
        console.error("Error in useFileTrashContent:", error);
        throw new Error(error.message);
      }
    },
  });

export const useSendTrash = (
  onProgress?: (progress: UploadProgressData) => void
) =>
  useMutation({
    mutationFn: async (data: {
      type: "text" | "file";
      textContent?: string;
      files?: File[];
      passcode?: string;
      expireAt?: Date;
    }) => {
      const result = await sendTrash({
        ...data,
        onProgress,
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to send trash");
      }

      return result.data;
    },
  });
