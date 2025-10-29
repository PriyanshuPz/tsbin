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
}

const TrashContext = createContext<TrashContextType | undefined>(undefined);

interface TrashProviderProps {
  children: ReactNode;
  trashId: string;
}

export function TrashProvider({ children, trashId }: TrashProviderProps) {
  const [passcode, setPasscode] = useState<string>("");
  const [showPasscodeView, setShowPasscodeView] = useState<boolean>(false);

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
  } = useFileTrashContent();

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
    }
  }, [trashContent, trash?.encrypted]);

  const submitPasscode = () => {
    if (trash && passcode) {
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
