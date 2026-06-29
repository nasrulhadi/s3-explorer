import { create } from "zustand";
import type { SecureVaultData } from "../lib/secureVault";
import {
  changeSecureVaultPassword,
  createSecureVault,
  disableSecureVault,
  hasSecureVault,
  lockSecureVault,
  resetAllConnectionStorage,
  unlockSecureVault,
} from "../lib/secureVault";

interface SecurityState {
  isMasterPasswordEnabled: boolean;
  isUnlocked: boolean;
}

interface SecurityActions {
  unlock: (password: string) => Promise<SecureVaultData>;
  enableMasterPassword: (password: string, data: SecureVaultData) => Promise<void>;
  disableMasterPassword: (password: string, data: SecureVaultData) => Promise<void>;
  changeMasterPassword: (
    currentPassword: string,
    newPassword: string,
    data: SecureVaultData,
  ) => Promise<void>;
  resetMasterPasswordAndConnections: () => void;
  lock: () => void;
}

export type SecurityStore = SecurityState & SecurityActions;

const secureVaultExists = hasSecureVault();

function validatePassword(password: string) {
  if (!password) throw new Error("Master password is required.");
  if (password.length < 8) throw new Error("Master password must be at least 8 characters.");
}

export const useSecurityStore = create<SecurityStore>()((set) => ({
  isMasterPasswordEnabled: secureVaultExists,
  isUnlocked: !secureVaultExists,

  unlock: async (password) => {
    if (!password) throw new Error("Enter your master password.");
    const data = await unlockSecureVault(password);
    set({ isMasterPasswordEnabled: true, isUnlocked: true });
    return data;
  },

  enableMasterPassword: async (password, data) => {
    validatePassword(password);
    await createSecureVault(password, data);
    set({ isMasterPasswordEnabled: true, isUnlocked: true });
  },

  disableMasterPassword: async (password, data) => {
    if (!password) throw new Error("Enter your current master password.");
    await disableSecureVault(password, data);
    set({ isMasterPasswordEnabled: false, isUnlocked: true });
  },

  changeMasterPassword: async (currentPassword, newPassword, data) => {
    if (!currentPassword) throw new Error("Enter your current master password.");
    validatePassword(newPassword);
    await changeSecureVaultPassword(currentPassword, newPassword, data);
    set({ isMasterPasswordEnabled: true, isUnlocked: true });
  },

  resetMasterPasswordAndConnections: () => {
    resetAllConnectionStorage();
    set({ isMasterPasswordEnabled: false, isUnlocked: true });
  },

  lock: () => {
    if (!hasSecureVault()) return;
    lockSecureVault();
    set({ isMasterPasswordEnabled: true, isUnlocked: false });
  },
}));
