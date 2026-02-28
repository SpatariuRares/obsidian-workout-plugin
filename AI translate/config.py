"""
Configuration for the AI Translation Tool.

Language mappings, Ollama settings, and translation parameters.
"""

# Ollama configuration
OLLAMA_BASE_URL = "http://localhost:11434"
# Available models:
#   - mistral              (4.4 GB)  — fast, good for quick translations
#   - gemma:7b             (5.0 GB)  — Google, balanced quality/speed
#   - translategemma:4b   (3.3 GB) — Google, specialized translation model
#   - translategemma:12b   (12.2 GB) — Google, specialized translation model
#   - qwen3:8b             (5.3 GB)  — Alibaba, excellent multilingual
#   - devstral:24b         (14 GB)   — Mistral, high quality
#   - gpt-oss:20b          (13 GB)   — open-source GPT
#   - qwen3:32b            (20 GB)   — Alibaba, excellent multilingual
#   - glm-4.7-flash:q8_0   (31 GB)   — fast inference, large
#   - glm-4.7-flash:bf16   (59 GB)   — highest quality, very large
DEFAULT_MODEL = "translategemma:latest"
REQUEST_TIMEOUT = 120  # seconds

# Translation settings
CHUNK_SIZE = 20  # Number of key-value pairs per translation request
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds between retries
DELAY_BETWEEN_CHUNKS = 0.5  # seconds between API calls
PARALLEL_WORKERS = 4  # Number of parallel translation threads (1 = sequential)

# Paths (relative to project root)
LOCALES_DIR = "app/i18n/locales"
SOURCE_LOCALE = "en"

# Language name mappings for locale codes
LANGUAGE_NAMES: dict[str, str] = {
    "ar": "Arabic",
    "cz": "Czech",
    "da": "Danish",
    "de": "German",
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "hi": "Hindi",
    "id": "Indonesian",
    "it": "Italian",
    "ja": "Japanese",
    "ko": "Korean",
    "nl": "Dutch",
    "no": "Norwegian",
    "pl": "Polish",
    "pt": "Portuguese",
    "pt-BR": "Brazilian Portuguese",
    "ro": "Romanian",
    "ru": "Russian",
    "sq": "Albanian",
    "tr": "Turkish",
    "uk": "Ukrainian",
    "zh": "Chinese (Simplified)",
    "zh-TW": "Chinese (Traditional)",
}

# Reverse mapping: language name -> locale code (used by TranslateGemma)
LANGUAGE_CODES: dict[str, str] = {v: k for k, v in LANGUAGE_NAMES.items()}
