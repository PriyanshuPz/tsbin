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

  if (isLoadingTrash || isLoadingContent) {
    return <div className="w-full p-6 text-sm text-gray-600">Loading...</div>;
  }

  if (errorLoadingTrash || errorLoadingContent) {
    return (
      <div className="w-full p-6 text-sm text-gray-600">
        Error loading content.
      </div>
    );
  }

  if (!trashContent) {
    return (
      <div className="w-full p-6 text-sm text-gray-600">No content found.</div>
    );
  }

  // Safe access to the encrypted text field
  const text = (trashContent as any)?.enc_trash_text || "";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (err) {
      toast.error("Unable to copy");
    }
  };

  return (
    <div className="w-full p-6 bg-white border border-gray-100 rounded-md">
      <div className="mb-3">
        <h3 className="text-base font-medium text-gray-800">Text</h3>
        <p className="text-xs text-gray-500">Encrypted text content</p>
      </div>

      <div className="mb-4">
        <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-3 rounded">
          {text}
        </pre>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={copyToClipboard}
          className="px-3 py-2 text-sm bg-gray-800 text-white rounded hover:opacity-90"
        >
          Copy
        </button>
        <button
          onClick={() => toast("No actions available", { icon: "ℹ️" })}
          className="px-3 py-2 text-sm border border-gray-200 text-gray-700 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}
