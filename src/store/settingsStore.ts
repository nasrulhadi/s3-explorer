import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "system" | "light" | "dark";

interface SettingsState {
  // Startup
  restoreLastSession: boolean;
  // Appearance
  theme: ThemeMode;
  accentColor: string;  // Accent color ID (default: "stone")
  // Toolbar
  showFilter: boolean;
  showUpload: boolean;
  showNewFolder: boolean;
  showReload: boolean;
  showBreadcrumbs: boolean;
}

interface SettingsActions {
  setRestoreLastSession: (value: boolean) => void;
  setTheme: (value: ThemeMode) => void;
  setAccentColor: (value: string) => void;
  setShowFilter: (value: boolean) => void;
  setShowUpload: (value: boolean) => void;
  setShowNewFolder: (value: boolean) => void;
  setShowReload: (value: boolean) => void;
  setShowBreadcrumbs: (value: boolean) => void;
}

export type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // ── State (all defaults) ────────────────────────────────
      restoreLastSession: false,
      theme: "system",
      accentColor: "stone",  // Default accent color (easily changeable)
      showFilter: true,
      showUpload: true,
      showNewFolder: true,
      showReload: true,
      showBreadcrumbs: true,

      // ── Actions ─────────────────────────────────────────────
      setRestoreLastSession: (value) => set({ restoreLastSession: value }),
      setTheme: (value) => set({ theme: value }),
      setAccentColor: (value) => set({ accentColor: value }),
      setShowFilter: (value) => set({ showFilter: value }),
      setShowUpload: (value) => set({ showUpload: value }),
      setShowNewFolder: (value) => set({ showNewFolder: value }),
      setShowReload: (value) => set({ showReload: value }),
      setShowBreadcrumbs: (value) => set({ showBreadcrumbs: value }),
    }),
    {
      name: "s3-explorer-settings",
    },
  ),
);
