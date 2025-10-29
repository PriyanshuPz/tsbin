import { useParams } from "react-router-dom";
import TextTrash from "./TextTrash";
import FileTrash from "./FileTrash";
import { TrashProvider, useTrashContext } from "../context/useTrashContext";

function TrashPageContent() {
  const {
    trash,
    trashContent,
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
    return <div className="loading">Loading...</div>;
  }

  if (errorLoadingTrash) {
    return <div className="error">Error loading trash data.</div>;
  }

  if (!trash) {
    return <div className="error">No trash data found.</div>;
  }

  if (showPasscodeView) {
    return (
      <div className="passcode-container">
        <h2>🔒 Encrypted Content</h2>
        <p>
          This trash is encrypted. Please enter the passcode to view its
          contents.
        </p>
        <div className="passcode-form">
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Enter passcode"
            className="passcode-input"
            onKeyPress={(e) => e.key === "Enter" && submitPasscode()}
          />
          <button onClick={submitPasscode} className="submit-button">
            Submit
          </button>
        </div>
        {isLoadingContent && <div className="loading">Loading content...</div>}
        {errorLoadingContent && (
          <div className="error">Error loading trash content.</div>
        )}
      </div>
    );
  }

  return (
    <div className="trash-content">
      <div className="trash-header">
        <h1>📁 Trash Content</h1>
        <div className="trash-info">
          <span className="trash-type">{trash.type}</span>
          {trash.encrypted && (
            <span className="encrypted-badge">🔒 Encrypted</span>
          )}
        </div>
      </div>

      <div className="content-container">
        {trash.type === "TEXT" && <TextTrash />}
        {trash.type === "FILE" && <FileTrash />}
      </div>

      {isLoadingContent && <div className="loading">Loading content...</div>}
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
