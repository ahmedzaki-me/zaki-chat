// Zodiac signs
const blockedEmojis: ReadonlySet<string> = new Set([
  "\u{2648}",
  "\u{2649}",
  "\u{264A}",
  "\u{264B}",
  "\u{264C}",
  "\u{264D}",
  "\u{264E}",
  "\u{264F}",
  "\u{2650}",
  "\u{2651}",
  "\u{2652}",
  "\u{2653}",
  "\u{26CE}",
  "\u{1F44D}\u{1F3FB}", // 👍🏻
  // LGBT-related symbols
  "\u{1F3F3}\u200D\u{1F308}",
  "\u{1F3F3}\u200D\u{26A7}",
  "\u{26A7}",
  // Symbols of other religions
  "\u{271D}",
  "\u{2626}",
  "\u{2721}",
  "\u{1F549}",
  "\u{2638}",
  "\u{262F}",
  "\u{1F52F}",
  "\u{1FAAF}",
  "\u{1F54E}",
  "\u{26E9}",
  "\u{1F6D0}",
  "\u{26EA}",
  "\u{1F54D}",
  "\u{1F6D5}",
]);

export function isEmojiAllowed(emoji: string): boolean {
  return !blockedEmojis.has(emoji.replaceAll("\uFE0F", ""));
}
