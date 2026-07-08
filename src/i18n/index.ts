import { useSettingsStore } from "../store/settingsStore";
import { en } from "./en";
import { id } from "./id";
import type { Translations } from "./types";

export type Language = "en" | "id";

const dictionaries: Record<Language, Translations> = { en, id };

export function useT(): Translations {
  const lang = useSettingsStore((s) => s.language ?? "en");
  return dictionaries[lang] ?? en;
}
