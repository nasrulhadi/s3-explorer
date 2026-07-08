import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ColumnWidths } from "../types";
import type { Language } from "../i18n";

export type ThemeMode = "system" | "light" | "dark";

export const DEFAULT_COL_WIDTHS: ColumnWidths = {
  name: -1,    // fr (flex)
  size: 100,
  modified: 170,
  class: 100,
};

interface SettingsState {
  // Startup
  restoreLastSession: boolean;
  // Appearance
  theme: ThemeMode;
  accentColor: string;  // Accent color ID (default: "brown")
  language: Language;
  // Column widths (persisted, resizable via header drag)
  columnWidths: ColumnWidths;
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
  setLanguage: (value: Language) => void;
  setColumnWidths: (value: ColumnWidths) => void;
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
      accentColor: "brown",  // Default accent color (easily changeable)
      language: "en",
      columnWidths: { ...DEFAULT_COL_WIDTHS },
      showFilter: true,
      showUpload: true,
      showNewFolder: true,
      showReload: true,
      showBreadcrumbs: true,

      // ── Actions ─────────────────────────────────────────────
      setRestoreLastSession: (value) => set({ restoreLastSession: value }),
      setTheme: (value) => set({ theme: value }),
      setAccentColor: (value) => set({ accentColor: value }),
      setLanguage: (value) => set({ language: value }),
      setColumnWidths: (value) => set({ columnWidths: value }),
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
