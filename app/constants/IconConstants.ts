export const UI_ICONS = {
  TABLE: {
    REPS: "🔁 ",
    WEIGHT: "🏋️ ",
    VOLUME: "📊 ",
  },
  ACTIONS: {
    ADD: "➕",
    EDIT: "✏️",
    DELETE: "🗑️",
    REFRESH: "🔄",
  },
  STATUS: {
    SUCCESS: "✅",
    ERROR: "❌",
    WARNING: "⚠️",
    INFO: "ℹ️",
  },
  DASHBOARD: {
    QUICK_STATS: {
      PERIODS: {
        WEEK: "🗓️",
        MONTH: "📆",
        YEAR: "📈",
      },
      METRICS: {
        WORKOUTS: "🏋️",
        TOTAL_VOLUME: "📦",
        AVG_VOLUME: "📊",
      },
    },
    SUMMARY: {
      TOTAL_WORKOUTS: "🏋️",
      CURRENT_STREAK: "🔥",
      TOTAL_VOLUME: "📦",
      PERSONAL_RECORDS: "🏅",
    },
  },
} as const;
