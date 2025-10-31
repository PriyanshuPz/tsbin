import { useParams, useNavigate } from "react-router-dom";
import TextTrash from "./TextTrash";
import FileTrash from "./FileTrash";
import { TrashProvider, useTrashContext } from "../context/useTrashContext";

function TrashPageContent() {
  const navigate = useNavigate();
  const {
    trash,
    passcode,
    setPasscode,
    isLoadingTrash,
    isLoadingContent,
    errorLoadingTrash,
    errorLoadingContent,
    showPasscodeView,
    submitPasscode,
  } = useTrashContext();

  if (isLoadingTrash) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 max-w-md w-full mx-4">
          <div className="text-center">
            {/* Enhanced loading animation */}
            <div className="relative mx-auto mb-6 w-16 h-16">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-gray-900 rounded-full animate-spin"></div>
              <div className="absolute inset-2 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xl">📦</span>
              </div>
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-2">
              🔍 Loading Trash
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Fetching your secure content...
            </p>

            {/* Animated dots */}
            <div className="flex justify-center space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (errorLoadingTrash) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-3xl text-gray-300 mb-4">❌</div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Error Loading
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Unable to load this trash. It may have expired or been deleted.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!trash) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-3xl text-gray-300 mb-4">🗑️</div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Not Found
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              This trash doesn't exist or has been deleted.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showPasscodeView) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-2xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <h1 className="text-2xl font-thin text-gray-900 tracking-wide">
                  tsbin
                </h1>
                <p className="text-sm text-gray-500 mt-1 font-light">
                  Encrypted Content
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-md mx-auto px-6 py-16">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
            <div className="text-center mb-6">
              <div className="text-3xl text-gray-300 mb-4">🔒</div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Protected Content
              </h2>
              <p className="text-sm text-gray-600">
                Enter the passcode to unlock this content
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  onKeyPress={(e) => e.key === "Enter" && submitPasscode()}
                  autoFocus
                />
              </div>

              <button
                onClick={submitPasscode}
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Unlock
              </button>

              <button
                onClick={() => navigate("/")}
                className="w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Go Home
              </button>
            </div>

            {isLoadingContent && (
              <div className="mt-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-xs text-gray-600">Decrypting content...</p>
              </div>
            )}

            {errorLoadingContent && (
              <div className="mt-6 text-center">
                <p className="text-xs text-red-500">
                  Incorrect passcode. Please try again.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="text-gray-500 hover:text-gray-700 transition-colors"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="text-center flex-1">
              <h1 className="text-2xl font-thin text-gray-900 tracking-wide">
                tsbin
              </h1>
              <p className="text-sm text-gray-500 mt-1 font-light">
                {trash.type.toLowerCase()} •{" "}
                {trash.encrypted ? "encrypted" : "public"}
              </p>
            </div>
            <div className="w-5 h-5"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        {trash.type === "TEXT" && <TextTrash />}
        {trash.type === "FILE" && <FileTrash />}
      </div>
    </div>
  );
}

export default function TrashPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>No trash ID provided.</div>;
  }

  return (
    <TrashProvider trashId={id}>
      <TrashPageContent />
    </TrashProvider>
  );
}
