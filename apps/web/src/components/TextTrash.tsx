import { useTrashContext } from "../context/useTrashContext";

export default function TextTrash() {
  const {
    trash,
    trashContent,
    isLoadingTrash,
    isLoadingContent,
    errorLoadingTrash,
    errorLoadingContent,
  } = useTrashContext();

  if (isLoadingTrash || isLoadingContent) {
    return <div className="loading">Loading...</div>;
  }

  if (errorLoadingTrash || errorLoadingContent) {
    return <div className="error">Error loading text trash content.</div>;
  }

  if (!trashContent) {
    return <div className="error">No text trash content found.</div>;
  }

  return (
    <div className="text-trash-container">
      <div className="text-content">
        <h3>📝 Text Content</h3>
        <div className="text-display">
          <pre>{trashContent.enc_trash_text}</pre>
        </div>
      </div>
      <div className="text-actions">
        <button
          onClick={() =>
            navigator.clipboard.writeText(trashContent.enc_trash_text)
          }
          className="copy-button"
        >
          📋 Copy to Clipboard
        </button>
      </div>
    </div>
  );
}
