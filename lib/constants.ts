export const TIER_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "ultra", label: "Ultra" },
] as const;

export type Tier = (typeof TIER_OPTIONS)[number]["value"];

type TierColor = "emerald" | "violet" | "cyan";

const TIER_COLOR_MAP: Record<TierColor, { border: string; text: string }> = {
  emerald: {
    border: "border-emerald-500/20",
    text: "text-emerald-400",
  },
  violet: {
    border: "border-violet-500/30",
    text: "text-violet-400",
  },
  cyan: {
    border: "border-cyan-500/20",
    text: "text-cyan-400",
  },
};

export function getTierColorClasses(color: TierColor) {
  return TIER_COLOR_MAP[color];
}

// Tier styling constants for UI components
export const TIER_STYLES: Record<
  Tier,
  {
    gradient: string;
    border: string;
    text: string;
    badge: string;
  }
> = {
  free: {
    gradient: "from-emerald-500 to-teal-600",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    badge: "bg-emerald-500/90 text-white",
  },
  pro: {
    gradient: "from-violet-500 to-fuchsia-600",
    border: "border-violet-500/30",
    text: "text-violet-400",
    badge: "bg-violet-500/90 text-white",
  },
  ultra: {
    gradient: "from-cyan-400 to-blue-600",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    badge: "bg-cyan-500/90 text-white",
  },
};

export const TIER_FEATURES = [
  {
    tier: "Free",
    color: "emerald",
    features: [
      "Access to foundational courses",
      "Community Discord access",
      "Basic projects & exercises",
      "Email support",
    ],
  },
  {
    tier: "Pro",
    color: "violet",
    features: [
      "Everything in Free",
      "All Pro-tier courses",
      "Advanced real-world projects",
      "Priority support",
      "Course completion certificates",
    ],
  },
  {
    tier: "Ultra",
    color: "cyan",
    features: [
      "Everything in Pro",
      "AI Learning Assistant",
      "Exclusive Ultra-only content",
      "Monthly 1-on-1 sessions",
      "Private Discord channel",
      "Early access to new courses",
      "Lifetime updates",
    ],
  },
] as const;

export const TIME_SLOTS = {
  SLOT_8_10: "8:00 AM - 10:00 AM",
  SLOT_10_12: "10:00 AM - 12:00 PM",
  SLOT_12_2: "12:00 PM - 2:00 PM",
  SLOT_3_5: "3:00 PM - 5:00 PM",
  SLOT_5_7: "5:00 PM - 7:00 PM",
} as const;

export const CLASS_DAYS = {
  MWF: "Mon / Wed / Fri",
  TTS: "Tue / Thu / Sat",
} as const;

export const CAMPUS_LAB_NAMES = [
  "Lab 1",
  "Lab 2",
  "Lab 3",
  "Lab 4",
  "Lab 5",
  "Lab 6",
  "Lab 7",
  "Lab 8",
  "Lab 9",
  "Lab 10",
] as const;

export const ASSET_CATEGORIES = {
  COMPUTER: "Computer",
  MONITOR: "Monitor",
  KEYBOARD: "Keyboard",
  MOUSE: "Mouse",
  CHAIR: "Chair",
  TABLE: "Table",
  NETWORK_SWITCH: "Network Switch",
  NETWORK_CABLE: "Network Cable",
  HEADSET: "Headset",
  WEBCAM: "Webcam",
  PROJECTOR: "Projector",
  OTHER: "Other",
} as const;

export const ASSET_CONDITIONS = {
  GOOD: "Good",
  FAIR: "Fair",
  DAMAGED: "Damaged",
  UNDER_REPAIR: "Under Repair",
  MISSING: "Missing",
  RETIRED: "Retired",
} as const;

export const ASSET_LOG_ACTIONS = {
  ADDED: "Added",
  REPAIRED: "Repaired",
  DAMAGED: "Damaged",
  MISSING: "Reported Missing",
  RETIRED: "Retired",
  UPDATED: "Updated",
  RETURNED: "Returned",
} as const;

export type TimeSlotKey = keyof typeof TIME_SLOTS;
export type ClassDaysKey = keyof typeof CLASS_DAYS;
