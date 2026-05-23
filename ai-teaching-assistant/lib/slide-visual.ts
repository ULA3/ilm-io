/** Build educational slide illustration URLs + emoji fallbacks */

function hashSeed(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h << 5) - h + text.charCodeAt(i);
  return Math.abs(h).toString(36);
}

export function slideImagePrompt(visualHint: string, title?: string, topic?: string): string {
  const parts = [visualHint, title, topic].filter(Boolean).join(". ").replace(/\s+/g, " ").trim();
  const core = parts.slice(0, 180) || "school learning";
  return `Friendly educational illustration for students, simple clear colorful diagram, no text in image: ${core}`;
}

export function slideImageUrl(visualHint: string, title?: string, topic?: string): string {
  const prompt = slideImagePrompt(visualHint, title, topic);
  const seed = hashSeed(prompt);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=720&height=405&nologo=true&seed=${seed}`;
}

const KEYWORD_EMOJI: [RegExp, string][] = [
  [/malaysia|melayu|spm|upsr|kangkung|nasi|pasar/i, "🇲🇾"],
  [/photo|light|sun|plant|chlorophyll|leaf/i, "🌿"],
  [/water|river|ocean|rain/i, "💧"],
  [/animal|cell|body|heart|blood/i, "🫀"],
  [/math|number|equation|calculate/i, "🔢"],
  [/history|war|king|empire/i, "🏛️"],
  [/space|planet|star|moon/i, "🪐"],
  [/computer|code|digital/i, "💻"],
  [/music|sound|audio/i, "🎵"],
  [/food|cook|nutrition/i, "🍎"],
  [/energy|power|electric/i, "⚡"],
];

export function conceptEmoji(visualHint: string, title?: string): string {
  const text = `${visualHint} ${title ?? ""}`;
  for (const [re, emoji] of KEYWORD_EMOJI) {
    if (re.test(text)) return emoji;
  }
  return "📚";
}
