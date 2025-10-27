import type { TextTrashContent } from "../lib/queries";

interface TextTrashProps {
  data: TextTrashContent;
  isLoading: boolean;
  isError: boolean;
}

export default function TextTrash({
  data,
  isLoading,
  isError,
}: TextTrashProps) {
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading text trash content.</div>;
  }

  return <div>TextTrash: {data.enc_trash_text}</div>;
}
