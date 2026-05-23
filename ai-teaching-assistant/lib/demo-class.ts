/**
 * Sample class roster — matches backend/supabase/migrations/001_initial.sql seed IDs.
 * Used when the students table is empty or unreachable.
 */
import type { StudentProfile } from "@/lib/api";

export const DEMO_CLASS_ROSTER: StudentProfile[] = [
  {
    id: "11111111-0000-0000-0000-000000000001",
    name: "Alex Chen",
    emoji: "🦋",
    condition: "ADHD · Visual",
    learning_style: "visual",
    streak_days: 7,
    weekly_progress: 70,
    insights: [
      { label: "Best focus time", value: "Morning sessions", trend: "stable" },
      { label: "Attention span", value: "~18 min blocks", trend: "up" },
    ],
    attention_trend: [82, 78, 90, 65, 88, 76, 85],
    last_active: new Date().toISOString(),
  },
  {
    id: "11111111-0000-0000-0000-000000000002",
    name: "Sam Rivera",
    emoji: "🌻",
    condition: "Dyslexia",
    learning_style: "auditory",
    streak_days: 3,
    weekly_progress: 50,
    insights: [
      { label: "Preferred format", value: "Audio & Easy Read", trend: "stable" },
      { label: "Reading pace", value: "Improving", trend: "up" },
    ],
    attention_trend: [60, 55, 70, 65, 72, 68, 74],
    last_active: new Date().toISOString(),
  },
  {
    id: "11111111-0000-0000-0000-000000000003",
    name: "Jordan Park",
    emoji: "🦉",
    condition: "Autism Spectrum",
    learning_style: "structured",
    streak_days: 12,
    weekly_progress: 85,
    insights: [
      { label: "Routine adherence", value: "High", trend: "stable" },
      { label: "Completion rate", value: "92%", trend: "up" },
    ],
    attention_trend: [90, 88, 92, 87, 95, 91, 93],
    last_active: new Date().toISOString(),
  },
  {
    id: "11111111-0000-0000-0000-000000000004",
    name: "Maya Osei",
    emoji: "🌿",
    condition: "ADHD · Dyscalculia",
    learning_style: "kinesthetic",
    streak_days: 5,
    weekly_progress: 60,
    insights: [
      { label: "Math engagement", value: "Improving with chunks", trend: "up" },
      { label: "Focus sessions", value: "15 min blocks", trend: "stable" },
    ],
    attention_trend: [55, 60, 58, 65, 62, 70, 68],
    last_active: new Date().toISOString(),
  },
];
