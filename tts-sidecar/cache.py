import hashlib
import os
from pathlib import Path

import numpy as np
import soundfile as sf


class TTSCache:
    def __init__(self):
        self.cache_dir = Path(os.environ.get("TTS_CACHE_DIR", "/data/tts-cache"))
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _key(self, text: str, lang: str, voice: str) -> str:
        raw = f"{text}|{lang}|{voice}"
        return hashlib.sha256(raw.encode()).hexdigest()

    def get(self, text: str, lang: str, voice: str) -> Path | None:
        path = self.cache_dir / f"{self._key(text, lang, voice)}.wav"
        return path if path.exists() else None

    def put(
        self, text: str, lang: str, voice: str, audio_data: np.ndarray, sample_rate: int
    ) -> Path:
        path = self.cache_dir / f"{self._key(text, lang, voice)}.wav"
        sf.write(str(path), audio_data, sample_rate)
        return path
