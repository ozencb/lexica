import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from kokoro_onnx import Kokoro
from pydantic import BaseModel

from cache import TTSCache

logger = logging.getLogger(__name__)

SUPPORTED_LANGS = {"en", "fr", "es"}
LANG_CODES = {"en": "en-us", "fr": "fr-fr", "es": "es"}
DEFAULT_VOICES = {"en": "af_heart", "fr": "ff_siwis", "es": "ef_dora"}

kokoro: Kokoro | None = None
cache = TTSCache()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global kokoro
    logger.info("Loading kokoro-onnx model")
    kokoro = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
    yield
    kokoro = None


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
    return {"kokoro_available": True, "languages": list(SUPPORTED_LANGS)}


@app.post("/api/tts/synthesize")
def tts(req: TTSRequest):
    if req.lang not in SUPPORTED_LANGS:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {req.lang}")

    voice = req.voice or DEFAULT_VOICES[req.lang]

    cached = cache.get(req.text, req.lang, voice)
    if cached:
        return FileResponse(cached, media_type="audio/wav")

    samples, sample_rate = kokoro.create(
        req.text, voice=voice, speed=1.0, lang=LANG_CODES[req.lang]
    )

    if samples is None or len(samples) == 0:
        raise HTTPException(status_code=500, detail="No audio generated")

    path = cache.put(req.text, req.lang, voice, samples, sample_rate)
    return FileResponse(path, media_type="audio/wav")
