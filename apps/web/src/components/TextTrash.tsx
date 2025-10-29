import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTrashContext } from "../context/useTrashContext";
import toast from "react-hot-toast";

export default function TextTrash() {
  const {
    trashContent,
    isLoadingTrash,
    isLoadingContent,
    errorLoadingTrash,
    errorLoadingContent,
  } = useTrashContext();

  const [isCopied, setIsCopied] = useState(false);
  const navigate = useNavigate();

  if (isLoadingTrash || isLoadingContent) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  if (errorLoadingTrash || errorLoadingContent) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center">
          <div className="text-3xl text-gray-300 mb-4">❌</div>
          <p className="text-sm text-gray-600">Error loading content</p>
        </div>
      </div>
    );
  }

  if (!trashContent) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center">
          <div className="text-3xl text-gray-300 mb-4">📄</div>
          <p className="text-sm text-gray-600">No content found</p>
        </div>
      </div>
    );
  }

  // Safe access to the encrypted text field
  const text = (trashContent as any)?.enc_trash_text || "";
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = text.length;
  const lineCount = text.split("\n").length;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success("Copied to clipboard");

      // Reset the copied state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error("Unable to copy");
    }
  };

  return (
    <div className="space-y-6">
      {/* Text Content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-1">
          <textarea
            value={text}
            readOnly
            className="w-full h-96 p-4 bg-transparent border-none outline-none resize-none text-gray-800 text-sm leading-relaxed font-mono"
            style={{ minHeight: "24rem" }}
          />
        </div>
      </div>

      {/* Text Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-4">
          Statistics
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-light text-gray-900 mb-1">
              {wordCount}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Words
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-light text-gray-900 mb-1">
              {charCount}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Characters
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-light text-gray-900 mb-1">
              {lineCount}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Lines
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={copyToClipboard}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              isCopied
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            {isCopied ? (
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Copied!</span>
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>Copy Text</span>
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
      </div>
    </div>
  );
}
