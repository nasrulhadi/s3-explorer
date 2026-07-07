// Shared context menu style constants used across the app.
// Separated from FileList.tsx so they can be reused.

export const MENU_CONTENT =
  "min-w-[180px] bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 p-1 z-50";
export const MENU_ITEM =
  "flex items-center gap-2.5 px-2.5 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-md outline-none cursor-default select-none data-[highlighted]:bg-[var(--s3-accent-base)] data-[highlighted]:text-[var(--s3-accent-text)] data-[disabled]:opacity-40 data-[disabled]:pointer-events-none";
export const MENU_SEPARATOR = "h-px bg-gray-200 dark:bg-zinc-700 my-1";
export const MENU_SHORTCUT = "ml-auto text-xs text-gray-400 dark:text-gray-500";
