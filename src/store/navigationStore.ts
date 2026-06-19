import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NavigationState } from "../types";

interface NavigationActions {
  /**
   * Set connection ID saja (tanpa bucket).
   * Dipakai saat klik koneksi di sidebar sebelum memilih bucket.
   */
  setConnectionId: (connectionId: string) => void;

  /**
   * Pilih bucket dan reset prefix ke root.
   * Otomatis push prefix lama ke history sebelum berpindah bucket.
   */
  setBucket: (connectionId: string, bucket: string) => void;

  /**
   * Navigasi ke prefix (folder) baru.
   * Push prefix sekarang ke history sebelum berpindah.
   */
  setPrefix: (prefix: string) => void;

  /** Kembali ke prefix sebelumnya dari history stack */
  goBack: () => void;

  /** Reset navigasi ke state awal (deselect bucket & prefix) */
  goHome: () => void;

  /** Push prefix sekarang ke history (dipakai internal oleh setPrefix / setBucket) */
  pushHistory: (prefix: string) => void;
}

export type NavigationStore = NavigationState & NavigationActions;

const INITIAL_STATE: NavigationState = {
  connectionId: null,
  bucket: null,
  prefix: "",
  history: [],
};

export const useNavigationStore = create<NavigationStore>()(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────────
      ...INITIAL_STATE,

      // ── Actions ────────────────────────────────────────────────

      setConnectionId: (connectionId) => {
        set({
          connectionId,
          bucket: null,
          prefix: "",
          history: [],
        });
      },

      setBucket: (connectionId, bucket) => {
        const { prefix } = get();

        set({
          connectionId,
          bucket,
          prefix: "",
          // Keep current prefix in history only if we were already inside a bucket
          history: prefix ? [prefix] : [],
        });
      },

      setPrefix: (prefix) => {
        const { history: currentHistory, prefix: currentPrefix } = get();

        set({
          prefix,
          history: [...currentHistory, currentPrefix],
        });
      },

      goBack: () => {
        const { history } = get();
        if (history.length === 0) return;

        const newHistory = [...history];
        const previousPrefix = newHistory.pop() ?? "";

        set({
          prefix: previousPrefix,
          history: newHistory,
        });
      },

      goHome: () => {
        set(INITIAL_STATE);
      },

      pushHistory: (prefix) => {
        set((state) => ({
          history: [...state.history, prefix],
        }));
      },
    }),
    {
      name: "s3-explorer-navigation",
      // Persist connectionId, bucket, prefix — not history (transient data)
      partialize: (state) => ({
        connectionId: state.connectionId,
        bucket: state.bucket,
        prefix: state.prefix,
      }),
    },
  ),
);
