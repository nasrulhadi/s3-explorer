import { create } from "zustand";

interface CopiedItem {
  key: string;
  name: string;
  type: "file" | "folder";
}

interface ClipboardState {
  items: CopiedItem[];
  sourceBucket: string | null;
  sourcePrefix: string | null;

  copy: (items: CopiedItem[], bucket: string, prefix: string) => void;
  clear: () => void;
}

export const useClipboardStore = create<ClipboardState>((set) => ({
  items: [],
  sourceBucket: null,
  sourcePrefix: null,

  copy: (items, bucket, prefix) =>
    set({ items, sourceBucket: bucket, sourcePrefix: prefix }),

  clear: () =>
    set({ items: [], sourceBucket: null, sourcePrefix: null }),
}));
