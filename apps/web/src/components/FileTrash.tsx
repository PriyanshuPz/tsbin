import { useState } from "react";
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

  if (isLoadingTrash || isLoadingContent) {
    return <div className="w-full p-6 text-sm text-gray-600">Loading...</div>;
  }

  if (errorLoadingTrash || errorLoadingContent) {
    return (
      <div className="w-full p-6 text-sm text-gray-600">
        Error loading file.
      </div>
    );
  }

  if (!trashContent) {
    return (
      <div className="w-full p-6 text-sm text-gray-600">No file found.</div>
    );
  }

  const file = trashContent as any;
  const name = file.fileName || "unknown";
  const size = file.fileSize || "-";
  const type = file.fileType || "application/octet-stream";
  const url = file.downloadUrl;

  const isImage = type && String(type).startsWith("image");

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
    <div className="w-full p-6 bg-white border border-gray-100 rounded-md">
      <div className="mb-3">
        <h3 className="text-base font-medium text-gray-800">File</h3>
        <p className="text-xs text-gray-500">{name}</p>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-2">
          <p className="text-sm text-gray-600">
            Type: <span className="text-gray-800">{type}</span>
          </p>
          <p className="text-sm text-gray-600">
            Size: <span className="text-gray-800">{size}</span>
          </p>
        </div>

        <div className="flex items-center justify-end space-x-2">
          {isImage && url ? (
            <img
              src={url}
              alt={name}
              className="max-h-40 object-contain rounded border border-gray-100"
            />
          ) : (
            <div className="text-sm text-gray-600">Preview not available</div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={handleDownload}
          className="px-3 py-2 text-sm bg-gray-800 text-white rounded hover:opacity-90"
          disabled={!url || isDownloading}
        >
          {isDownloading ? "Downloading..." : "Download"}
        </button>

        <button
          onClick={() => toast("No actions available", { icon: "ℹ️" })}
          className="px-3 py-2 text-sm border border-gray-200 text-gray-700 rounded"
        >
          Close
        </button>
      </div>

      {downloadProgress !== null && (
        <div className="mt-4 w-full bg-gray-100 rounded h-2">
          <div
            className="h-2 bg-gray-800 rounded"
            style={{
              width: `${Math.max(0, Math.min(100, downloadProgress))}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}
