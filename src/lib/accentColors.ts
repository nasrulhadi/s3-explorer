// ─── Accent Color Configuration ─────────────────────────────────
// Easily customizable: add/remove colors here
// Default color can be changed in settingsStore.ts

export interface AccentColor {
  id: string;
  label: string;
  // Light mode colors (soft pastel)
  light: {
    base: string;      // Background
    hover: string;     // Hover state
    active: string;    // Active/selected state
    text: string;      // Text color for contrast
  };
  // Dark mode colors (slightly darker/more saturated)
  dark: {
    base: string;
    hover: string;
    active: string;
    text: string;
  };
}

export const ACCENT_COLORS: AccentColor[] = [
  {
    id: "blue",
    label: "Blue",
    light: {
      base: "#dbeafe",      // Soft pastel blue
      hover: "#bfdbfe",
      active: "#60a5fa",    // Sharper blue (was #93c5fd)
      text: "#1e40af",
    },
    dark: {
      base: "#1e3a8a",      // Darker blue for dark mode
      hover: "#1e40af",
      active: "#2563eb",
      text: "#dbeafe",
    },
  },
  {
    id: "green",
    label: "Green",
    light: {
      base: "#d1fae5",      // Soft pastel green
      hover: "#a7f3d0",
      active: "#10b981",    // Sharper green (was #6ee7b7)
      text: "#065f46",
    },
    dark: {
      base: "#064e3b",
      hover: "#065f46",
      active: "#059669",
      text: "#d1fae5",
    },
  },
  {
    id: "yellow",
    label: "Yellow",
    light: {
      base: "#fef3c7",      // Soft pastel yellow
      hover: "#fde68a",
      active: "#f59e0b",    // Sharper amber (was #fcd34d)
      text: "#92400e",
    },
    dark: {
      base: "#78350f",
      hover: "#92400e",
      active: "#d97706",
      text: "#fef3c7",
    },
  },
  {
    id: "brown",
    label: "Brown",
    light: {
      base: "#fed7aa",      // Soft pastel brown/peach
      hover: "#fdba74",
      active: "#f97316",    // Sharper orange (was #fb923c)
      text: "#7c2d12",
    },
    dark: {
      base: "#7c2d12",
      hover: "#9a3412",
      active: "#ea580c",
      text: "#fed7aa",
    },
  },
  {
    id: "stone",
    label: "Stone",
    light: {
      base: "#e7e5e4",      // Soft pastel stone/gray
      hover: "#d6d3d1",
      active: "#78716c",    // Sharper stone (was #a8a29e)
      text: "#44403c",
    },
    dark: {
      base: "#44403c",
      hover: "#57534e",
      active: "#78716c",
      text: "#e7e5e4",
    },
  },
];

// Helper function to get color by ID
export function getAccentColor(id: string): AccentColor {
  return ACCENT_COLORS.find((c) => c.id === id) || ACCENT_COLORS[3]; // Default to brown
}
