import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  useFileTrashContent,
  useTextTrashContent,
  useTrash,
  type TrashData,
  type TextTrashContent,
  type FileTrashContent,
} from "../lib/queries";

interface TrashContextType {
  trash: TrashData | undefined;
  trashContent: TextTrashContent | FileTrashContent | undefined;
  passcode: string;
  setPasscode: (passcode: string) => void;
  isLoadingTrash: boolean;
  isLoadingContent: boolean;
  errorLoadingTrash: boolean;
  errorLoadingContent: boolean;
  showPasscodeView: boolean;
  submitPasscode: () => void;
  decryptionProgress: {
    percentage: number;
    uploadedChunks: number;
    totalChunks: number;
    failedChunks: number[];
  } | null;
}

const TrashContext = createContext<TrashContextType | undefined>(undefined);

interface TrashProviderProps {
  children: ReactNode;
  trashId: string;
}

export function TrashProvider({ children, trashId }: TrashProviderProps) {
  const [passcode, setPasscode] = useState<string>("");
  const [showPasscodeView, setShowPasscodeView] = useState<boolean>(false);
  const [decryptionProgress, setDecryptionProgress] = useState<{
    percentage: number;
    uploadedChunks: number;
    totalChunks: number;
    failedChunks: number[];
  } | null>(null);

  const {
    data: trash,
    isLoading: isLoadingTrash,
    isError: errorLoadingTrash,
  } = useTrash(trashId);

  const {
    data: textTrashContent,
    isPending: isLoadingTextContent,
    isError: errorLoadingTextContent,
    mutate: mutateTextTrashContent,
  } = useTextTrashContent();

  const {
    data: fileTrashContent,
    isPending: isLoadingFileContent,
    isError: errorLoadingFileContent,
    mutate: mutateFileTrashContent,
  } = useFileTrashContent(
    (progress: {
      percentage: number;
      uploadedChunks: number;
      totalChunks: number;
      failedChunks: number[];
    }) => {
      setDecryptionProgress(progress);
    }
  );

  // Determine current content and loading states
  const trashContent =
    trash?.type === "TEXT" ? textTrashContent : fileTrashContent;
  const isLoadingContent =
    trash?.type === "TEXT" ? isLoadingTextContent : isLoadingFileContent;
  const errorLoadingContent =
    trash?.type === "TEXT" ? errorLoadingTextContent : errorLoadingFileContent;

  // Handle automatic content loading for non-encrypted trash
  useEffect(() => {
    if (trash && !trash.encrypted) {
      // Initialize progress for non-encrypted files too
      setDecryptionProgress({
        percentage: 0,
        uploadedChunks: 0,
        totalChunks: 0,
        failedChunks: [],
      });

      if (trash.type === "TEXT") {
        mutateTextTrashContent({
          id: trash.objectId,
          passcode: "0000",
        });
      } else if (trash.type === "FILE") {
        mutateFileTrashContent({
          id: trash.objectId,
          passcode: "0000",
        });
      }
      setShowPasscodeView(false);
    } else if (trash && trash.encrypted) {
      setShowPasscodeView(true);
    }
  }, [trash, mutateTextTrashContent, mutateFileTrashContent]);

  // Handle successful content loading for encrypted trash
  useEffect(() => {
    if (trashContent && trash?.encrypted) {
      setShowPasscodeView(false);
      // Reset progress when content is loaded
      setTimeout(() => setDecryptionProgress(null), 1000);
    }
  }, [trashContent, trash?.encrypted]);

  // Also handle successful content loading for non-encrypted trash
  useEffect(() => {
    if (trashContent && !trash?.encrypted) {
      // Reset progress when content is loaded for non-encrypted files too
      setTimeout(() => setDecryptionProgress(null), 1000);
    }
  }, [trashContent, trash?.encrypted]);

  const submitPasscode = () => {
    if (trash && passcode) {
      setDecryptionProgress({
        percentage: 0,
        uploadedChunks: 0,
        totalChunks: 0,
        failedChunks: [],
      }); // Initialize progress
      if (trash.type === "TEXT") {
        mutateTextTrashContent({
          id: trash.objectId,
          passcode: passcode,
        });
      } else if (trash.type === "FILE") {
        mutateFileTrashContent({
          id: trash.objectId,
          passcode: passcode,
        });
      }
    }
  };

  const value: TrashContextType = {
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
    decryptionProgress,
  };

  return (
    <TrashContext.Provider value={value}>{children}</TrashContext.Provider>
  );
}

export function useTrashContext() {
  const context = useContext(TrashContext);
  if (context === undefined) {
    throw new Error("useTrashContext must be used within a TrashProvider");
  }
  return context;
}
