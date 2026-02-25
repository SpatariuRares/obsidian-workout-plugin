"""
Translation engine for the AI Translation Tool.

Contains the Translator class that handles LLM-based translation
of i18n key-value pairs using LlamaIndex + Ollama.

Supports two modes:
  - Generic LLM: sends a JSON array of values, parses JSON array back
  - TranslateGemma: uses the model's specific prompt format, one value at a time
"""

import json
import time

from llama_index.llms.ollama import Ollama

from config import (
    DEFAULT_MODEL,
    LANGUAGE_CODES,
    MAX_RETRIES,
    OLLAMA_BASE_URL,
    REQUEST_TIMEOUT,
    RETRY_DELAY,
)


def _is_translategemma(model: str) -> bool:
    """Check if the model is a TranslateGemma variant."""
    return "translategemma" in model.lower()


class Translator:
    """Translates i18n JSON files using LlamaIndex + Ollama."""

    def __init__(self, model: str = DEFAULT_MODEL):
        self.llm = Ollama(
            model=model,
            base_url=OLLAMA_BASE_URL,
            request_timeout=REQUEST_TIMEOUT,
            temperature=0.1,
        )
        self.model = model
        self.use_translategemma = _is_translategemma(model)

    # ------------------------------------------------------------------
    # Generic LLM mode (JSON object in/out)
    # ------------------------------------------------------------------

    def _build_prompt_generic(self, chunk: dict[str, str], target_lang: str) -> str:
        """Build the translation prompt for generic LLMs with keys for context."""
        chunk_json = json.dumps(chunk, indent=2, ensure_ascii=False)

        return f"""You are a professional translator specializing in UI localization.
Translate the following English strings into {target_lang}.

CONTEXT:
The keys (e.g., 'modal.titles.createLog') provide hierarchical context about where the string is used in the application.

RULES:
1. Return ONLY a valid JSON object with the EXACT same keys.
2. Translate ONLY the values.
3. Do NOT translate placeholder tokens like {{name}}, {{unit}}, {{score}}, {{exercise}}, etc.
4. Do NOT translate technical symbols like +, -, ★, ◆, •, ×, ~.
5. Do NOT add any explanation, markdown, or commentary.
6. Preserve any emoji at the start of values (e.g., "✅", "❌", "⚠️", "📸").
7. Ensure the output is valid JSON.

English strings to translate (as JSON):
{chunk_json}

Respond with ONLY the translated JSON object:"""

    def _parse_response_generic(self, response_text: str, chunk: dict[str, str]) -> dict[str, str] | None:
        """Parse a JSON object response from a generic LLM."""
        text = response_text.strip()
        expected_keys = list(chunk.keys())

        # Try to find JSON block if model wrapped it in markdown
        if "```" in text:
            start = text.find("{")
            end = text.rfind("}") + 1
            if start != -1 and end > start:
                text = text[start:end]

        # Ensure it starts and ends with braces
        if not text.startswith("{"):
            start = text.find("{")
            end = text.rfind("}") + 1
            if start != -1 and end > start:
                text = text[start:end]

        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                # Ensure all expected keys are present, fallback to original if missing
                result = {}
                missing_count = 0
                for key in expected_keys:
                    if key in parsed:
                        result[key] = str(parsed[key])
                    else:
                        result[key] = chunk[key]
                        missing_count += 1
                
                # Check if we got a significant number of missing keys (indicates failure)
                if missing_count > len(expected_keys) / 3:
                    return None
                    
                return result
        except json.JSONDecodeError:
            pass

        return None

    # ------------------------------------------------------------------
    # TranslateGemma mode (plain text, one value at a time)
    # ------------------------------------------------------------------

    def _build_prompt_translategemma(self, key: str, value: str, target_lang: str, target_code: str) -> str:
        """Build TranslateGemma's specific prompt format with key context."""
        return (
            f"You are a professional English (en) to {target_lang} ({target_code}) translator specializing in UI localization. "
            f"Context: The key for this UI string is '{key}'. "
            f"Your goal is to accurately convey the meaning and nuances of the original English text "
            f"while adhering to {target_lang} grammar, vocabulary, and cultural sensitivities. "
            f"Produce only the {target_lang} translation, without any additional explanations or commentary. "
            f"Please translate the following English text into {target_lang}: {value}"
        )

    def _translate_chunk_translategemma(
        self, chunk: dict[str, str], target_lang: str, target_code: str
    ) -> dict[str, str]:
        """Translate a chunk using TranslateGemma (one call per value)."""
        result: dict[str, str] = {}

        for key, value in chunk.items():
            # Skip values that are just symbols/numbers/placeholders
            if not value or value.strip() in ("+", "-", "×", "~", "★", "◆", "•"):
                result[key] = value
                continue

            prompt = self._build_prompt_translategemma(key, value, target_lang, target_code)

            try:
                response = self.llm.complete(prompt)
                translated = response.text.strip()
                # Remove quotes if the model wraps in them
                if translated.startswith('"') and translated.endswith('"'):
                    translated = translated[1:-1]
                result[key] = translated
            except Exception as e:
                print(f"    ⚠️  Error translating '{key}': {e}, using original")
                result[key] = value

        return result

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def translate_chunk(
        self, chunk: dict[str, str], target_lang: str, retry: int = 0
    ) -> dict[str, str]:
        """Translate a single chunk of key-value pairs.

        Keys are preserved from the source; only values are sent to the LLM.
        Automatically selects the right strategy based on the model.
        """
        if self.use_translategemma:
            target_code = LANGUAGE_CODES.get(target_lang, "")
            return self._translate_chunk_translategemma(chunk, target_lang, target_code)

        # Generic LLM path
        prompt = self._build_prompt_generic(chunk, target_lang)

        try:
            response = self.llm.complete(prompt)
            translated_dict = self._parse_response_generic(response.text, chunk)

            if translated_dict is None:
                if retry < MAX_RETRIES:
                    print(f"    ⚠️  Parse error, retry {retry + 1}/{MAX_RETRIES}...")
                    time.sleep(RETRY_DELAY)
                    return self.translate_chunk(chunk, target_lang, retry + 1)
                else:
                    print(f"    ❌ Failed to parse after {MAX_RETRIES} retries, using originals")
                    return chunk

            return translated_dict

        except Exception as e:
            if retry < MAX_RETRIES:
                print(f"    ⚠️  Error: {e}, retry {retry + 1}/{MAX_RETRIES}...")
                time.sleep(RETRY_DELAY)
                return self.translate_chunk(chunk, target_lang, retry + 1)
            else:
                print(f"    ❌ Failed after {MAX_RETRIES} retries: {e}")
                return chunk
