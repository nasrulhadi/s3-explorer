import { create } from "zustand";
import type { Transfer } from "../types";

interface TransferState {
  /** Daftar semua transfer (upload / download) yang sedang berjalan atau selesai */
  transfers: Transfer[];
}

interface TransferActions {
  /** Tambah transfer baru ke daftar */
  addTransfer: (transfer: Transfer) => void;

  /**
   * Update field transfer berdasarkan ID.
   * Umumnya dipakai untuk update `transferredBytes`, `status`, dan `error`.
   */
  updateTransfer: (id: string, data: Partial<Omit<Transfer, "id">>) => void;

  /** Hapus satu transfer berdasarkan ID */
  removeTransfer: (id: string) => void;

  /** Hapus semua transfer yang sudah selesai (status: "done" atau "error") */
  clearCompleted: () => void;
}

export type TransferStore = TransferState & TransferActions;

export const useTransferStore = create<TransferStore>()((set) => ({
  // ── State ──────────────────────────────────────────────────
  transfers: [],

  // ── Actions ────────────────────────────────────────────────

  addTransfer: (transfer) => {
    set((state) => ({
      transfers: [...state.transfers, transfer],
    }));
  },

  updateTransfer: (id, data) => {
    set((state) => ({
      transfers: state.transfers.map((t) =>
        t.id === id ? { ...t, ...data } : t,
      ),
    }));
  },

  removeTransfer: (id) => {
    set((state) => ({
      transfers: state.transfers.filter((t) => t.id !== id),
    }));
  },

  clearCompleted: () => {
    set((state) => ({
      transfers: state.transfers.filter(
        (t) => t.status !== "done" && t.status !== "error",
      ),
    }));
  },
}));
