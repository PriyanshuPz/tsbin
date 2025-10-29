import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTrashContext } from "../context/useTrashContext";
import toast from "react-hot-toast";

export default function FileTrash() {
  const {
    trashContent,
    isLoadingTrash,
    isLoadingContent,
    errorLoadingTrash,
    errorLoadingContent,
  } = useTrashContext();

  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const navigate = useNavigate();

  if (isLoadingTrash || isLoadingContent) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading file...</p>
        </div>
      </div>
    );
  }

  if (errorLoadingTrash || errorLoadingContent) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center">
          <div className="text-3xl text-gray-300 mb-4">❌</div>
          <p className="text-sm text-gray-600">Error loading file</p>
        </div>
      </div>
    );
  }

  if (!trashContent) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center">
          <div className="text-3xl text-gray-300 mb-4">📁</div>
          <p className="text-sm text-gray-600">No file found</p>
        </div>
      </div>
    );
  }

  const file = trashContent as any;
  const name = file.fileName || "unknown";
  const size = file.fileSize || "-";
  const type = file.fileType || "application/octet-stream";
  const url = file.downloadUrl;

  const isImage = type && String(type).startsWith("image");
  const isVideo = type && String(type).startsWith("video");
  const isAudio = type && String(type).startsWith("audio");
  const isText =
    type &&
    (String(type).startsWith("text") ||
      type.includes("json") ||
      type.includes("xml"));

  const formatFileSize = (sizeStr: string): string => {
    // If size is already formatted, return as is
    if (typeof sizeStr === "string" && sizeStr.includes(" ")) {
      return sizeStr;
    }
    // If it's a number, format it
    const bytes = parseInt(sizeStr);
    if (isNaN(bytes)) return sizeStr;

    const sizes = ["B", "KB", "MB", "GB"];
    if (bytes === 0) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = () => {
    if (isImage) return "🖼️";
    if (isVideo) return "🎥";
    if (isAudio) return "🎵";
    if (isText) return "📄";
    return "📁";
  };

  const handleDownload = async () => {
    if (!url) return toast.error("No download URL available");

    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to download");

      const contentLength = res.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength, 10) : NaN;

      if (!res.body || isNaN(total)) {
        // fallback: blob at once
        const blob = await res.blob();
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(href);
        setDownloadProgress(100);
        toast.success("Download started");
        return;
      }

      const reader = res.body.getReader();
      const chunks = [] as Uint8Array[];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          setDownloadProgress(Math.round((received / total) * 100));
        }
      }

      // `chunks` is an array of Uint8Array; cast to `any` to satisfy TS BlobPart typing in browser env
      const blob = new Blob(chunks as any);
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);

      setDownloadProgress(100);
      toast.success("Download complete");
    } catch (err) {
      console.error(err);
      toast.error("Download failed");
    } finally {
      setIsDownloading(false);
      // reset progress after a short delay
      setTimeout(() => setDownloadProgress(null), 800);
    }
  };

  return (
    <div className="space-y-6">
      {/* File Preview */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {isImage && url ? (
          <div className="aspect-video bg-gray-50 flex items-center justify-center">
            <img
              src={url}
              alt={name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : isVideo && url ? (
          <div className="aspect-video bg-gray-50">
            <video
              src={url}
              controls
              className="w-full h-full"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        ) : isAudio && url ? (
          <div className="p-12 bg-gray-50">
            <div className="text-center mb-6">
              <div className="text-4xl text-gray-300 mb-4">🎵</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{name}</h3>
            </div>
            <audio src={url} controls className="w-full" preload="metadata">
              Your browser does not support the audio element.
            </audio>
          </div>
        ) : (
          <div className="p-12 bg-gray-50 text-center">
            <div className="text-4xl text-gray-300 mb-4">{getFileIcon()}</div>
            <p className="text-sm text-gray-600">Preview not available</p>
          </div>
        )}
      </div>

      {/* File Details */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-start space-x-4">
          <div className="shrink-0">
            <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-xl">
              {getFileIcon()}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate mb-2">
              {name}
            </h3>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Type:</span> {type}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Size:</span>{" "}
                {formatFileSize(size)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownload}
            disabled={!url || isDownloading}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
              !url || isDownloading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            {isDownloading ? (
              <span className="flex items-center space-x-2">
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Downloading...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Download</span>
              </span>
            )}
          </button>

          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Create New
          </button>
        </div>

        {downloadProgress !== null && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
              <span>Downloading...</span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-gray-900 h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(0, Math.min(100, downloadProgress))}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
