import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  /** If true, restore last session (bucket/folder) on app open. If false, always show home page. */
  restoreLastSession: boolean;
}

interface SettingsActions {
  setRestoreLastSession: (value: boolean) => void;
}

export type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // ── State ──────────────────────────────────────────────────
      restoreLastSession: false, // default: always go to home page

      // ── Actions ────────────────────────────────────────────────
      setRestoreLastSession: (value) => set({ restoreLastSession: value }),
    }),
    {
      name: "s3-explorer-settings",
    },
  ),
);
