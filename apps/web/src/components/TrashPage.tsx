import { useParams } from "react-router-dom";
import TextTrash from "./TextTrash";
import FileTrash from "./FileTrash";
import { TrashProvider, useTrashContext } from "../context/useTrashContext";

function TrashPageContent() {
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
    return <div className="w-full p-6 text-sm text-gray-600">Loading...</div>;
  }

  if (errorLoadingTrash) {
    return (
      <div className="w-full p-6 text-sm text-gray-600">Error loading.</div>
    );
  }

  if (!trash) {
    return <div className="w-full p-6 text-sm text-gray-600">Not found.</div>;
  }

  if (showPasscodeView) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white border border-gray-100 rounded-md">
        <h2 className="text-lg font-medium text-gray-800 mb-2">Encrypted</h2>
        <p className="text-sm text-gray-500 mb-4">
          Enter the passcode to view contents.
        </p>

        <div className="flex items-center space-x-2">
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Passcode"
            className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm"
            onKeyPress={(e) => e.key === "Enter" && submitPasscode()}
          />
          <button
            onClick={submitPasscode}
            className="px-3 py-2 bg-gray-800 text-white rounded text-sm"
          >
            Unlock
          </button>
        </div>

        {isLoadingContent && (
          <div className="mt-3 text-sm text-gray-600">Loading content...</div>
        )}
        {errorLoadingContent && (
          <div className="mt-3 text-sm text-gray-600">
            Error loading content.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Trash</h1>
          <p className="text-sm text-gray-500">
            {trash.type} {trash.encrypted ? "• Encrypted" : ""}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {trash.type === "TEXT" && <TextTrash />}
        {trash.type === "FILE" && <FileTrash />}
      </div>

      {isLoadingContent && (
        <div className="mt-4 text-sm text-gray-600">Loading content...</div>
      )}
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
