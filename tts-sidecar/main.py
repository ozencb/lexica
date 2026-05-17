import logging
from contextlib import asynccontextmanager

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from kokoro import KPipeline
from pydantic import BaseModel

from cache import TTSCache

logger = logging.getLogger(__name__)

LANG_MAP = {"en": "a", "fr": "f", "es": "e"}
DEFAULT_VOICES = {"en": "af_heart", "fr": "ff_siwis", "es": "ef_dora"}

pipelines: dict[str, KPipeline] = {}
cache = TTSCache()


@asynccontextmanager
async def lifespan(app: FastAPI):
    for iso, kokoro_code in LANG_MAP.items():
        logger.info(f"Loading pipeline for {iso} ({kokoro_code})")
        pipelines[iso] = KPipeline(lang_code=kokoro_code)
    yield
    pipelines.clear()


app = FastAPI(lifespan=lifespan)


class TTSRequest(BaseModel):
    text: str
    lang: str
    voice: str | None = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/tts/status")
def tts_status():
    return {"kokoro_available": True, "languages": list(LANG_MAP.keys())}


@app.post("/api/tts/synthesize")
def tts(req: TTSRequest):
    if req.lang not in LANG_MAP:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {req.lang}")

    voice = req.voice or DEFAULT_VOICES[req.lang]

    cached = cache.get(req.text, req.lang, voice)
    if cached:
        return FileResponse(cached, media_type="audio/wav")

    pipeline = pipelines[req.lang]
    samples_list = []

    for _, _, audio in pipeline(req.text, voice=voice):
        samples_list.append(audio.numpy())

    if not samples_list:
        raise HTTPException(status_code=500, detail="No audio generated")

    audio_data = np.concatenate(samples_list)
    path = cache.put(req.text, req.lang, voice, audio_data, 24000)
    return FileResponse(path, media_type="audio/wav")
