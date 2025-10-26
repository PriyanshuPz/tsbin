import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchTrash, handleTrashAccess } from "../lib/apis";

interface TrashData {
  id: string;
  slug: string;
  type: string;
  content?: string;
  encryption_meta?: any;
  encrypted: boolean;
  views: number;
  expires_at: string | null;
  size: number;
  created_at: string;
  passcode_hash: string;
  files?: Array<{
    meta: {
      fileName: string;
      fileSize: number;
      mimeType?: string;
    };
    messageIds: number[];
    encryptedContent?: string;
  }>;
}

export default function TrashView() {
  const { id } = useParams<{ id: string }>();
  const [trashData, setTrashData] = useState<TrashData | null>(null);
  const [currentAction, setCurrentAction] = useState<string>("");
  const [displayContent, setDisplayContent] = useState<string>("");
  const [displayFiles, setDisplayFiles] = useState<Blob[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [passcode, setPasscode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  useEffect(() => {
    if (id) {
      fetchTrashData();
    }
  }, [id]);

  const fetchTrashData = async () => {
    try {
      setIsLoading(true);
      setError("");
      setLoadingProgress(0);

      const trashResponse = await fetchTrash(id!);
      if (!trashResponse.success) {
        setError(trashResponse.message || "Failed to load trash");
        return;
      }

      const trash = trashResponse.data;
      setTrashData(trash);

      // Use the new handleTrashAccess to determine what to do
      const accessResult = await handleTrashAccess(
        trash,
        undefined,
        (progress) => {
          setLoadingProgress(progress);
        }
      );
      await handleAccessResult(accessResult);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load trash");
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
    }
  };

  const handleAccessResult = async (result: any) => {
    setCurrentAction(result.action);

    switch (result.action) {
      case "showText":
        setDisplayContent(result.content);
        break;

      case "showFiles":
        setDisplayFiles(result.files);
        break;

      case "download":
        setDownloadUrl(result.url);
        break;

      case "promptPassword":
        // Will show password input
        break;

      case "error":
        setError(result.error);
        break;

      default:
        setError("Unknown action type");
    }
  };

  const handlePasswordSubmit = async () => {
    if (!trashData || !passcode) return;

    setIsProcessing(true);
    setError("");
    setLoadingProgress(0);

    try {
      const accessResult = await handleTrashAccess(
        trashData,
        passcode,
        (progress) => {
          setLoadingProgress(progress);
        }
      );
      await handleAccessResult(accessResult);
    } catch (err) {
      console.error("Password submit error:", err);
      setError("Invalid passcode or corrupted data");
    } finally {
      setIsProcessing(false);
      setLoadingProgress(0);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("URL copied to clipboard!");
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("URL copied to clipboard!");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const downloadFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${fileName}`);
  };

  const isImageType = (mimeType: string) => {
    return mimeType.startsWith("image/");
  };

  const isVideoType = (mimeType: string) => {
    return mimeType.startsWith("video/");
  };

  const isAudioType = (mimeType: string) => {
    return mimeType.startsWith("audio/");
  };

  const BlobFileDisplay = ({
    blob,
    fileName,
  }: {
    blob: Blob;
    fileName: string;
  }) => {
    const [objectUrl, setObjectUrl] = useState<string>("");

    useEffect(() => {
      const url = URL.createObjectURL(blob);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }, [blob]);

    const renderPreview = () => {
      if (isImageType(blob.type)) {
        return (
          <img
            src={objectUrl}
            alt={fileName}
            className="max-w-full h-auto rounded-lg border border-gray-200"
            style={{ maxHeight: "500px" }}
          />
        );
      }

      if (isVideoType(blob.type)) {
        return (
          <video
            controls
            className="max-w-full h-auto rounded-lg border border-gray-200"
            style={{ maxHeight: "500px" }}
          >
            <source src={objectUrl} type={blob.type} />
            Your browser does not support the video tag.
          </video>
        );
      }

      if (isAudioType(blob.type)) {
        return (
          <audio controls className="w-full">
            <source src={objectUrl} type={blob.type} />
            Your browser does not support the audio tag.
          </audio>
        );
      }

      // For other file types, show file icon
      return (
        <div className="flex items-center space-x-3">
          <div className="text-4xl">📄</div>
          <div>
            <h4 className="font-medium text-gray-800">{fileName}</h4>
            <p className="text-sm text-gray-500">
              {formatSize(blob.size)} • {blob.type || "Unknown type"}
            </p>
          </div>
        </div>
      );
    };

    return (
      <div className="mb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-800">{fileName}</h4>
            <button
              onClick={() => downloadFile(blob, fileName)}
              className="flex items-center space-x-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 text-sm"
            >
              <span>📥</span>
              <span>Download</span>
            </button>
          </div>

          {renderPreview()}

          <p className="text-xs text-gray-500 mt-2">
            {formatSize(blob.size)} • {blob.type}
          </p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !trashData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🗑️</div>
          <h1 className="text-2xl font-light text-gray-800 mb-4">Not Found</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            ← Create New Trash
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div /*className="min-h-screen bg-white"*/>
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            ← Back to tsbin
          </Link>

          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
          >
            <span className="text-sm">📋</span>
            <span className="text-sm font-medium">Copy URL</span>
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
          {currentAction === "promptPassword" ? (
            <div className="p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="text-4xl mb-4">🔒</div>
                <h2 className="text-xl font-medium text-gray-800 mb-4">
                  This content is encrypted
                </h2>
                <p className="text-gray-600 mb-6">
                  Enter the passcode to view the content
                </p>

                <div className="space-y-4">
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter passcode"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) =>
                      e.key === "Enter" && handlePasswordSubmit()
                    }
                  />

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <button
                    onClick={handlePasswordSubmit}
                    disabled={!passcode || isProcessing}
                    className={`w-full py-3 rounded-lg font-medium transition-colors duration-200 ${
                      passcode && !isProcessing
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isProcessing ? "Decrypting..." : "Decrypt"}
                  </button>
                </div>
              </div>
            </div>
          ) : currentAction === "showText" ? (
            <div className="p-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <pre className="whitespace-pre-wrap text-gray-800 text-base leading-relaxed font-mono">
                  {displayContent}
                </pre>
              </div>
            </div>
          ) : currentAction === "showFiles" ? (
            <div className="p-8">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Files ({displayFiles.length})
                </h3>
                {isProcessing ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">
                      {loadingProgress < 30
                        ? "Fetching file..."
                        : loadingProgress < 70
                          ? "Downloading..."
                          : loadingProgress < 90
                            ? "Decrypting..."
                            : "Almost done..."}
                    </p>
                    {loadingProgress > 0 && (
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${loadingProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          {Math.round(loadingProgress)}% complete
                        </p>
                      </div>
                    )}
                  </div>
                ) : displayFiles.length > 0 ? (
                  displayFiles.map((blob, index) => {
                    // Get filename from trash data
                    let fileName = `file-${index}`;
                    if (trashData?.files?.[index]?.meta?.fileName) {
                      fileName = trashData.files[index].meta.fileName;
                    }

                    return (
                      <BlobFileDisplay
                        key={index}
                        blob={blob}
                        fileName={fileName}
                      />
                    );
                  })
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                    <div className="text-4xl mb-4">📁</div>
                    <p className="text-gray-600">
                      No files available to display
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : currentAction === "download" ? (
            <div className="p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="text-4xl mb-4">📦</div>
                <h2 className="text-xl font-medium text-gray-800 mb-4">
                  Large File Download
                </h2>
                <p className="text-gray-600 mb-6">
                  This file is too large to display inline. Click below to
                  download.
                </p>

                <a
                  href={downloadUrl}
                  download
                  className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  <span className="mr-2">📥</span>
                  Download File
                </a>

                {trashData && (
                  <p className="text-sm text-gray-500 mt-4">
                    Size: {formatSize(trashData.size)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-center">
                  <div className="text-4xl mb-4">❓</div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Unable to Load Content
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {error || "Unknown content type or processing error"}
                  </p>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                  <button
                    onClick={fetchTrashData}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {trashData && (
          <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">ID:</span>
                <span className="ml-2 font-mono text-gray-800">
                  {trashData.slug}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 text-gray-800 capitalize">
                  {trashData.type}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Size:</span>
                <span className="ml-2 text-gray-800">
                  {formatSize(trashData.size)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Views:</span>
                <span className="ml-2 text-gray-800">{trashData.views}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 text-gray-800">
                  {formatDate(trashData.created_at)}
                </span>
              </div>
              {trashData.expires_at && (
                <div>
                  <span className="text-gray-500">Expires:</span>
                  <span className="ml-2 text-gray-800">
                    {formatDate(trashData.expires_at)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/*<footer className="text-center py-8 mt-16">
          <p className="text-xs text-gray-400">powered by tsbin</p>
        </footer>*/}
      </div>
    </div>
  );
}
