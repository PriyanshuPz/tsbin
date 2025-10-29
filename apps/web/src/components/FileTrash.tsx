import { useTrashContext } from "../context/useTrashContext";

export default function FileTrash() {
  const {
    trash,
    trashContent,
    isLoadingTrash,
    isLoadingContent,
    errorLoadingTrash,
    errorLoadingContent,
  } = useTrashContext();

  if (isLoadingTrash || isLoadingContent) {
    return <div>Loading...</div>;
  }

  if (errorLoadingTrash || errorLoadingContent) {
    return <div>Error loading file trash content.</div>;
  }

  if (!trashContent) {
    return <div>No file trash content found.</div>;
  }

  const fileTrashContent = trashContent as any; // Type assertion for file content

  return (
    <div className="file-trash-container">
      <div className="file-info">
        <h3>📁 File Information</h3>
        <p>
          <strong>Name:</strong> {fileTrashContent.fileName || "Unknown"}
        </p>
        <p>
          <strong>Size:</strong> {fileTrashContent.fileSize || "Unknown"}
        </p>
        <p>
          <strong>Type:</strong> {fileTrashContent.fileType || "Unknown"}
        </p>
      </div>

      {fileTrashContent.downloadUrl && (
        <div className="file-actions">
          <a
            href={fileTrashContent.downloadUrl}
            download={fileTrashContent.fileName}
            className="download-button"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              textDecoration: "none",
              borderRadius: "5px",
              margin: "10px 0",
            }}
          >
            📥 Download File
          </a>
        </div>
      )}

      <div className="file-status">
        <p>✅ File decrypted successfully and ready for download</p>
      </div>
    </div>
  );
}
