import { create } from "zustand";
import type { Update } from "@tauri-apps/plugin-updater";

interface UpdateState {
  update: Update | null;
  checking: boolean;
  setUpdate: (update: Update | null) => void;
  setChecking: (checking: boolean) => void;
  dismissUpdate: () => void;
}

export const useUpdateStore = create<UpdateState>((set) => ({
  update: null,
  checking: false,
  setUpdate: (update) => set({ update }),
  setChecking: (checking) => set({ checking }),
  dismissUpdate: () => set({ update: null }),
}));
