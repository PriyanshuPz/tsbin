import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import type { DragEvent, ChangeEvent } from "react";
import { useSendTrash, type UploadProgressData } from "../lib/queries";

interface MainBinProps {}

interface FilePreview {
  file: File;
  type: "text" | "image" | "video" | "audio" | "other";
  preview?: string;
  size: string;
}

interface FormData {
  textContent: string;
  passcode?: string;
  expireAt?: string;
}

export default function MainBin({}: MainBinProps) {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<FilePreview | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] =
    useState<UploadProgressData | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendTrashMutation = useSendTrash((progress: UploadProgressData) => {
    setUploadProgress(progress);
  });

  const {
    register,
    handleSubmit: onSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      textContent: "",
      passcode: "",
      expireAt: "",
    },
  });

  const textContent = watch("textContent");

  const getFileType = (file: File): FilePreview["type"] => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    if (file.type.startsWith("text/")) return "text";
    return "other";
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ["B", "KB", "MB", "GB"];
    if (bytes === 0) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const createFilePreview = (file: File): FilePreview => {
    const fileType = getFileType(file);
    const filePreview: FilePreview = {
      file,
      type: fileType,
      size: formatFileSize(file.size),
    };

    // Create preview for images
    if (fileType === "image") {
      filePreview.preview = URL.createObjectURL(file);
    }

    return filePreview;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0]; // Only accept one file

    // Check file size limit (100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 100MB.");
      return;
    }

    const filePreview = createFilePreview(file);
    setSelectedFile(filePreview);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = () => {
    if (selectedFile?.preview) {
      URL.revokeObjectURL(selectedFile.preview);
    }
    setSelectedFile(null);
  };

  const handleSubmit = async (data: FormData) => {
    if (sendTrashMutation.isPending) return;

    if (!data.textContent.trim() && !selectedFile) {
      toast.error("Please enter some text or select a file to upload.");
      return;
    }

    if (
      data.passcode &&
      (data.passcode.length < 4 || data.passcode.length > 32)
    ) {
      toast.error("Passcode must be between 4 and 32 characters.");
      return;
    }

    if (data.expireAt && new Date(data.expireAt) <= new Date()) {
      toast.error("Expiration date must be in the future.");
      return;
    }

    // Initialize progress
    setUploadProgress({
      percentage: 0,
      uploadedChunks: 0,
      totalChunks: 0,
      failedChunks: [],
      completed: false,
    });

    const loadingToast = toast.loading("Creating your trash...");

    try {
      const hasText = data.textContent.trim().length > 0;
      const hasFile = selectedFile !== null;

      let mutationData;

      if (hasFile) {
        mutationData = {
          type: "file" as const,
          textContent: hasText ? data.textContent : undefined,
          files: [selectedFile.file],
          passcode: data.passcode || undefined,
          expireAt: data.expireAt ? new Date(data.expireAt) : undefined,
        };
      } else if (hasText) {
        mutationData = {
          type: "text" as const,
          textContent: data.textContent,
          passcode: data.passcode || undefined,
          expireAt: data.expireAt ? new Date(data.expireAt) : undefined,
        };
      }

      if (mutationData) {
        const result = await sendTrashMutation.mutateAsync(mutationData);

        toast.dismiss(loadingToast);

        // Set final progress state
        setUploadProgress((prev) =>
          prev ? { ...prev, percentage: 100, completed: true } : null
        );
        toast.success("Trash created successfully! Redirecting...");

        reset();
        setSelectedFile(null);

        setTimeout(() => {
          navigate(`/t/${result}`);
        }, 900);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error submitting trash:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setTimeout(() => setUploadProgress(null), 600);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (type: FilePreview["type"]) => {
    switch (type) {
      case "image":
        return "🖼️";
      case "video":
        return "🎥";
      case "audio":
        return "🎵";
      case "text":
        return "📄";
      default:
        return "📁";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-thin text-gray-900 tracking-wide">
              tsbin
            </h1>
            <p className="text-sm text-gray-500 mt-2 font-light">
              Secure temporary file sharing
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={onSubmit(handleSubmit)} className="space-y-6">
          {/* Text Area */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-1">
              <textarea
                {...register("textContent")}
                placeholder="Enter your text here..."
                className="w-full h-48 p-4 bg-transparent border-none outline-none resize-none text-gray-800 placeholder-gray-400 text-sm leading-relaxed font-mono"
              />
            </div>
          </div>

          {/* File Drop Zone */}
          <div
            className={`relative bg-white rounded-lg border-2 border-dashed transition-all duration-200 ${
              isDragOver
                ? "border-gray-400 bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              /* File Preview */
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="shrink-0">
                    {selectedFile.type === "image" && selectedFile.preview ? (
                      <img
                        src={selectedFile.preview}
                        alt={selectedFile.file.name}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-2xl">
                        {getFileIcon(selectedFile.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {selectedFile.file.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedFile.size} • {selectedFile.type}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              /* Drop Zone */
              <div className="p-12 text-center">
                <div className="text-4xl text-gray-300 mb-4">📁</div>
                <p className="text-sm text-gray-500 mb-2">
                  Drop a file here, or{" "}
                  <button
                    type="button"
                    onClick={openFileDialog}
                    className="text-gray-700 underline underline-offset-2 hover:text-gray-900"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-gray-400">One file, up to 100MB</p>
              </div>
            )}

            {isDragOver && (
              <div className="absolute inset-0 bg-gray-50 bg-opacity-90 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl text-gray-500 mb-2">📎</div>
                  <p className="text-sm text-gray-600 font-medium">
                    Drop your file here
                  </p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="*/*"
          />

          {/* Advanced Options */}
          <div className="bg-white rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-4 py-3 text-left flex items-center justify-between text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-lg"
            >
              <span className="font-medium">Advanced Options</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  showAdvanced ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showAdvanced && (
              <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                {/* Passcode */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                    Passcode (Optional)
                  </label>
                  <input
                    {...register("passcode", {
                      minLength: {
                        value: 4,
                        message: "Passcode must be at least 4 characters",
                      },
                      maxLength: {
                        value: 32,
                        message: "Passcode must be at most 32 characters",
                      },
                    })}
                    type="password"
                    placeholder="Default: 0000"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  />
                  {errors.passcode && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.passcode.message}
                    </p>
                  )}
                </div>

                {/* Expiration */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                    Expiration (Optional)
                  </label>
                  <input
                    {...register("expireAt", {
                      validate: (value) => {
                        if (!value) return true;
                        return (
                          new Date(value) > new Date() ||
                          "Expiration must be in the future"
                        );
                      },
                    })}
                    type="datetime-local"
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  />
                  {errors.expireAt && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.expireAt.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploadProgress !== null && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              {/* Header with icon and title */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="relative">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">🚀</span>
                  </div>
                  {uploadProgress.completed && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white">
                      <span className="text-xs text-white">✓</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">
                    {uploadProgress.completed
                      ? "✅ Upload Complete!"
                      : "📤 Uploading File"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {uploadProgress.completed
                      ? "Your file has been securely uploaded"
                      : "Encrypting and uploading your file chunks..."}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {uploadProgress.percentage}%
                  </div>
                </div>
              </div>

              {/* Enhanced progress bar */}
              <div className="space-y-3">
                <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${uploadProgress.percentage}%` }}
                  >
                    {uploadProgress.percentage > 0 && (
                      <div className="absolute inset-0 bg-white bg-opacity-30 animate-pulse rounded-full"></div>
                    )}
                  </div>
                </div>

                {/* Detailed progress info */}
                {uploadProgress.totalChunks > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                      <div>
                        <span className="text-gray-500 block">
                          Chunks Uploaded
                        </span>
                        <span className="font-medium text-gray-900">
                          {uploadProgress.uploadedChunks} /{" "}
                          {uploadProgress.totalChunks}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Status</span>
                        <span
                          className={`font-medium ${
                            uploadProgress.completed
                              ? "text-green-600"
                              : uploadProgress.failedChunks.length > 0
                                ? "text-red-600"
                                : "text-blue-600"
                          }`}
                        >
                          {uploadProgress.completed
                            ? "Complete"
                            : uploadProgress.failedChunks.length > 0
                              ? `${uploadProgress.failedChunks.length} Failed`
                              : "Processing"}
                        </span>
                      </div>
                    </div>

                    {/* Chunk visualization for smaller files */}
                    {uploadProgress.totalChunks <= 20 && (
                      <div>
                        <span className="text-xs text-gray-500 block mb-2">
                          Chunk Progress
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(
                            { length: uploadProgress.totalChunks },
                            (_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 rounded-sm transition-all duration-300 ${
                                  i < uploadProgress.uploadedChunks
                                    ? "bg-green-500 shadow-sm"
                                    : uploadProgress.failedChunks.includes(i)
                                      ? "bg-red-500"
                                      : "bg-gray-300"
                                }`}
                                title={`Chunk ${i + 1}`}
                              />
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Error indicator */}
                    {uploadProgress.failedChunks.length > 0 && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center space-x-2">
                          <span className="text-red-500 text-xs">⚠️</span>
                          <span className="text-xs text-red-700">
                            {uploadProgress.failedChunks.length} chunk(s) failed
                            to upload
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Processing animation */}
                {!uploadProgress.completed && (
                  <div className="flex justify-center space-x-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={
                (!textContent?.trim() && !selectedFile) ||
                sendTrashMutation.isPending
              }
              className={`px-8 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                (!textContent?.trim() && !selectedFile) ||
                sendTrashMutation.isPending
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950 shadow-sm hover:shadow"
              }`}
            >
              {sendTrashMutation.isPending ? (
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
                  <span>Creating...</span>
                </span>
              ) : (
                "Create Bin"
              )}
            </button>
          </div>
        </form>

        {/* Features */}
        <div className="mt-12 text-center">
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-lg text-gray-400 mb-2">🔒</div>
              <p className="text-xs text-gray-600 font-medium">Encrypted</p>
            </div>
            <div className="text-center">
              <div className="text-lg text-gray-400 mb-2">⚡</div>
              <p className="text-xs text-gray-600 font-medium">Fast</p>
            </div>
            <div className="text-center">
              <div className="text-lg text-gray-400 mb-2">🚫</div>
              <p className="text-xs text-gray-600 font-medium">No signup</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
