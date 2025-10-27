import { useParams } from "react-router-dom";
import { useTextTrashContent, useTrash } from "../lib/queries";
import { useEffect, useState } from "react";
import TextTrash from "./TextTrash";

export default function TrashPage() {
  const { id } = useParams<{ id: string }>();
  const [passcode, setPasscode] = useState<string>("");
  const {
    data: trash,
    isLoading: loadingTrash,
    isError: errorLoadingTrash,
  } = useTrash(id || "");

  const {
    data: textTrashContent,
    isPending: loadingTextTrashContent,
    isError: errorLoadingTextTrashContent,
    mutate: mutateTextTrashContent,
  } = useTextTrashContent();

  useEffect(() => {
    if (trash && !trash.encrypted && trash.type === "TEXT") {
      mutateTextTrashContent({
        id: trash.objectId,
        passcode: "0000",
      });
    }

    return () => {
      // Cleanup if necessary
      setPasscode("");
    };
  }, [trash, mutateTextTrashContent]);

  if (loadingTrash) {
    return <div>Loading...</div>;
  }

  if (errorLoadingTrash) {
    return <div>Error loading trash data.</div>;
  }

  if (!trash) {
    return <div>No trash data found.</div>;
  }

  if (trash.encrypted) {
    return (
      <div>
        This trash is encrypted. Please enter the passcode to view its contents.
        <input
          type="password"
          value={passcode || ""}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Enter passcode"
        />
        <button
          onClick={() => {
            mutateTextTrashContent({
              id: trash.objectId,
              passcode: passcode,
            });
          }}
        >
          Submit
        </button>
        {loadingTextTrashContent && <div>Loading content...</div>}
        {errorLoadingTextTrashContent && (
          <div>Error loading text trash content.</div>
        )}
        {textTrashContent && (
          <div>
            <h2>Text Trash Content:</h2>
            <pre>{textTrashContent.enc_trash_text}</pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {loadingTrash && <div>Loading...</div>}
      <h2>Text Trash Content:</h2>
      {textTrashContent && (
        <div>
          {trash.type == "TEXT" && (
            <TextTrash
              data={textTrashContent}
              isLoading={loadingTextTrashContent}
              isError={errorLoadingTextTrashContent}
            />
          )}
        </div>
      )}
      {loadingTextTrashContent && <div>Loading content...</div>}
    </div>
  );
}
