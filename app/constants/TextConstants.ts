export const TEXT_CONSTANTS = {
    UI: {
        ACTIONS: {
            EDIT_WORKOUT: "Edit workout",
            DELETE_WORKOUT: "Delete workout",
            EXPORT: "📸 export",
        },
        LABELS: {
            EXERCISES_COUNT: "3 exercises",
            WORKOUT_PROGRESS: "Workout Progress",
            TRAINING_ANALYSIS: "Training analysis",
            FRONT: "Front",
            BACK: "Back",
            MUSCLE_HEAT_MAP: "Muscle heat map",
            TOTAL_WORKOUT: "Total Workout",
            WORKOUT_DATA: "Workout Data",
            WORKOUT_LOG: "Workout Log",
            CURRENT_FILE: "Current file",
            DASHBOARD: "Dashboard",
        },
        DISPLAY: {
            PERCENTAGE_45: "45%",
        },
        BUTTONS: {
            CREATE_FILE: "Create file",
        },
    },
    MESSAGES: {
        NO_DATA: "No workout data available",
        LOADING: "Loading workout data...",
        NO_DATA_PERIOD: "No workout data found for the selected time period.",
        TIMER_COMPLETED: "Timer completed!",
        WARNINGS: {
            IMBALANCE_ALERTS: "⚠️ imbalance alerts",
        },
        SUCCESS: {
            NO_IMBALANCES: "✅ no major muscle imbalances detected",
            CSV_CREATED: "CSV log file created successfully!",
            CODE_INSERTED: "✅ Code inserted successfully!",
        },
        ERRORS: {
            CSV_NOT_FOUND: "CSV log file not found",
            FILE_EMPTY: "File is empty",
            NO_FRONTMATTER: "No frontmatter found",
            NO_TAGS: "No tags found",
        },
        STATUS: {
            INSUFFICIENT_DATA: "insuff. data",
        },
    },
    FORMS: {
        LABELS: {
            EXERCISE_NAME: "Exercise Name",
        },
        LABELS_IT: {
            WORKOUT_NAME: "Workout name:",
        },
        PLACEHOLDERS: {
            ENTER_EXERCISE_NAME: "Enter exercise name",
            ENTER_CSV_PATH: "Enter CSV file path",
            ENTER_FOLDER_PATH: "Enter folder path",
        },
    },
    CHARTS: {
        LABELS: {
            REPS: "Reps",
        },
        LABELS_IT: {
            TREND_LINE: "Linea di Tendenza",
            DATE: "Data",
        },
        TYPES: {
            VOLUME: "volume",
            WEIGHT: "weight",
            REPS: "reps",
        },
    },
    MUSCLES: {
        NAMES: {
            TRAP: "Trap",
            TRAP_MID: "TrapMid",
            LATS: "Lats",
            LOWER: "Lower",
        },
        NAMES_IT: {
            BICIPITI: "Bicipiti",
            TRICIPITI: "Tricipiti",
            AVAMBRACCI: "Avambracci",
            SCHIENA: "Schiena",
            PETTO: "Petto",
            ADDOMINALI: "Addominali",
            OBLIQUI: "Obliqui",
            QUADRICIPITI: "Quadricipiti",
            FEMORALI: "Femorali",
            GLUTEI: "Glutei",
            POLPACCI: "Polpacci",
            SPALLE_ANTERIORI: "Spalle Anteriori",
            SPALLE_LATERALI: "Spalle Laterali",
            SPALLE_POSTERIORI: "Spalle Posteriori",
        },
        POSITIONS_IT: {
            ALTO: "Alto",
            MEDIO: "Medio",
            BASSO: "Basso",
        },
        GROUPS: {
            CORE: "Core",
        },
        BODY_PARTS: {
            UPPER_BODY: "Upper Body",
        },
    },
    STATS: {
        LABELS: {
            SESSIONS: "Sessions: ",
            RECENT_TREND: "Recent trend: ",
        },
        LABELS_IT: {
            AVG_VOLUME: "Volume medio: ",
        },
    },
    TRENDS: {
        STATUS_IT: {
            STABILE: "Stabile",
            INVARIATO: "Invariato",
            IN_AUMENTO: "in aumento",
            IN_DIMINUZIONE: "in diminuzione",
            STABILE_LOWER: "stabile",
        },
        DIRECTIONS: {
            UP: "up",
            DOWN: "down",
            NEUTRAL: "neutral",
        },
    },
    TIME_PERIODS: {
        WEEK: "Week",
        MONTH: "Month",
        YEAR: "Year",
    },
    COMMON: {
        UNITS: {
            WEIGHT_KG: "Weight (kg)",
        },
        TYPES: {
            EXERCISE: "exercise",
            WORKOUT: "workout",
        },
        DEFAULTS: {
            UNKNOWN: "Unknown",
        },
        NOT_AVAILABLE_IT: "N/D",
    },
    TIMER: {
        TYPES: {
            COUNTDOWN_LOWER: "countdown",
            COUNTDOWN: "Countdown",
            INTERVAL: "Interval",
        },
    },
    COMMANDS: {
        CREATE_CSV: "Create CSV log file",
        INSERT_TABLE: "Insert workout table",
    },
    DESCRIPTIONS: {
        INSERT_TABLE:
            "This will insert a comprehensive workout dashboard with statistics, charts, and quick actions.",
    },
    SETTINGS: {
        LABELS: {
            CSV_PATH: "CSV log file path",
            EXERCISE_FOLDER: "Exercise folder path",
        },
        DESCRIPTIONS: {
            CSV_PATH: "Path to the CSV file containing all workout log data",
            EXERCISE_FOLDER: "Path to the folder containing exercise pages",
            CREATE_CSV: "Create a new CSV log file with sample data",
        },
        SECTIONS: {
            CSV_MANAGEMENT: "CSV file management",
        },
    },
    ERRORS: {
        TYPES: {
            VALIDATION: "Validation Error",
            TABLE: "Table Error",
            GENERIC: "Error",
        },
    },
} as const;
