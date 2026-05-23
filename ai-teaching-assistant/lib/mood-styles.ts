/** Visual-only mood tokens — copy comes from ui-strings by language. */

export const MOOD_KEYS = ["good", "okay", "tired", "stressed"] as const;
export type MoodKey = (typeof MOOD_KEYS)[number];

export const MOOD_STYLES: Record<
  MoodKey,
  { emoji: string; pageBg: string; chip: string; card: string }
> = {
  good: {
    emoji: "😊",
    pageBg: "bg-gradient-to-br from-sage-lo via-cream to-honey-lo",
    chip: "bg-sage text-white shadow-sm border border-sage-hi/20",
    card: "bg-sage-lo border-2 border-sage text-bark-deep hover:border-sage-hi shadow-sm",
  },
  okay: {
    emoji: "😐",
    pageBg: "bg-gradient-to-br from-sand via-cream to-parch",
    chip: "bg-dust text-white shadow-sm border border-dust-hi/20",
    card: "bg-parch border-2 border-sand-mid text-bark-deep hover:border-dust shadow-sm",
  },
  tired: {
    emoji: "😔",
    pageBg: "bg-gradient-to-br from-dust-lo via-cream to-sand",
    chip: "bg-dust-lo text-dust-hi border border-dust-mid shadow-sm",
    card: "bg-dust-lo border-2 border-dust text-bark-deep hover:border-dust-hi shadow-sm",
  },
  stressed: {
    emoji: "😤",
    pageBg: "bg-gradient-to-br from-terra-lo via-cream to-honey-lo",
    chip: "bg-terra text-white shadow-sm border border-terra-hi/20",
    card: "bg-terra-lo border-2 border-terra-mid text-bark-deep hover:border-terra shadow-sm",
  },
};
