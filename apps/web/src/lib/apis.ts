import init, { TsbinController, UploadProgress } from "tsbin-wasm";
import { SITE_CONFIG } from "./constants";

export async function sendTrash(data: {
  type: "text" | "file";
  textContent?: string;
  files?: File[];
  passcode?: string;
  expireAt?: Date;
  onProgress?: (progress: {
    percentage: number;
    uploadedChunks: number;
    totalChunks: number;
    failedChunks: number[];
    completed: boolean;
  }) => void;
}) {
  try {
    await init();
    const passcode = data.passcode || "0000";

    let trashId: string | undefined = undefined;

    const ts = new TsbinController(SITE_CONFIG.API_URL, "");

    if (data.type === "text") {
      if (!data.textContent) {
        throw new Error("textContent is required for text type");
      }
      trashId = await ts.encrypt_text(data.textContent, passcode);
    }

    if (data.type === "file") {
      if (!data.files || data.files.length === 0) {
        throw new Error("files are required for file type");
      }
      const file = data.files[0];

      const onProgress = (progress: UploadProgress) => {
        console.log("Upload progress:", progress);
        // Calculate percentage from progress data
        const percentage =
          progress.total_chunks > 0
            ? Math.round(
                (progress.uploaded_chunks / progress.total_chunks) * 100
              )
            : 0;

        data.onProgress?.({
          percentage,
          uploadedChunks: progress.uploaded_chunks,
          totalChunks: progress.total_chunks,
          failedChunks: Array.from(progress.failed_chunks),
          completed: progress.completed,
        });
      };

      trashId = await ts.encrypt_file(file, passcode, undefined, onProgress);
    }

    return {
      success: true,
      data: trashId,
    };
  } catch (error) {
    console.error("sendTrash error:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to send trash",
    };
  }
}
