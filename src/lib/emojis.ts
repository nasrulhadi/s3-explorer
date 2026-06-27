/**
 * Curated emoji list for connection icons.
 * ~200 common emojis grouped by relevance for an S3/storage app.
 * No dependency — plain string array.
 */

export interface EmojiCategory {
  id: string;
  label: string;
  emojis: string[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: "storage",
    label: "Storage",
    emojis: [
      "📁", "📂", "🗄️", "💾", "💿", "📀", "📦", "🗃️", "📚", "🗂️",
      "📬", "📭", "📫", "📪", "📮", "📤", "📥", "📨",
    ],
  },
  {
    id: "cloud",
    label: "Cloud",
    emojis: [
      "☁️", "⛅", "🌤️", "🌥️", "🌦️", "🌧️", "⛈️", "🌩️", "🌨️", "🌪️",
      "🌈", "☀️", "🌙", "⭐", "🌟", "✨", "⚡", "🔥", "💥", "💫",
    ],
  },
  {
    id: "tech",
    label: "Tech",
    emojis: [
      "🖥️", "💻", "⌨️", "🖱️", "🗜️", "💽", "📱", "📲",
      "📟", "📠", "📡", "🔌", "🔋", "💡", "🔦", "🛠️", "🔧", "🔨",
      "⚙️", "⛓️", "🧰", "🧲", "🔬", "🔭",
    ],
  },
  {
    id: "security",
    label: "Security",
    emojis: [
      "🔑", "🗝️", "🔒", "🔓", "🔏", "🔐", "🛡️", "🚨", "⚠️", "🛑",
    ],
  },
  {
    id: "symbols",
    label: "Symbols",
    emojis: [
      "✅", "❌", "❓", "❗", "✔️", "✖️", "➕", "➖", "➗", "💯",
      "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟥", "🟧",
      "🟨", "🟩", "🟦", "🟪", "⬛", "⬜", "🔺", "🔻", "🔸", "🔹",
    ],
  },
  {
    id: "places",
    label: "Places",
    emojis: [
      "🏠", "🏢", "🏬", "🏭", "🏗️", "🏘️", "🏚️", "🏛️", "⛪",
      "🕌", "🕍", "⛩️", "🕋", "🌁", "🌃", "🏙️", "🌄", "🌅", "🌆",
    ],
  },
  {
    id: "nature",
    label: "Nature",
    emojis: [
      "🌱", "🌳", "🌲", "🌴", "🌵", "🍀", "🍁", "🌾", "🌿", "🌸",
      "🌺", "🌻", "🌹", "🌼", "🌷", "🐇", "🦊", "🐻", "🐼", "🦄",
    ],
  },
  {
    id: "food",
    label: "Food",
    emojis: [
      "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍑", "🍒", "🥝",
      "🍍", "🥭", "🌽", "🥕", "🍞", "🧀", "🍖", "🍗", "🍔", "🍕",
    ],
  },
  {
    id: "activity",
    label: "Activity",
    emojis: [
      "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸",
      "🥅", "🎮", "🎯", "🎲", "🎰", "🚀", "✈️", "🚁", "🛸", "🛰️",
    ],
  },
  {
    id: "misc",
    label: "Misc",
    emojis: [
      "😀", "😎", "🤔", "👀", "🙌", "👍", "👎", "👏", "🙏", "💪",
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "💖",
      "🔔", "🔕", "📢", "📣", "💬", "💭", "🗯️", "♻️", "🏆", "🎗️",
    ],
  },
];

/** Flat list of all emojis (for search across categories) */
export const ALL_EMOJIS: string[] = EMOJI_CATEGORIES.flatMap((c) => c.emojis);

/** Total count (should be ~200) */
export const EMOJI_COUNT = ALL_EMOJIS.length;
