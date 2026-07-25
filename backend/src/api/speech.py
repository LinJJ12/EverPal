from __future__ import annotations

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import Response

from src.capabilities.speech import synthesize_speech, transcribe_audio
from src.config.settings import get_settings
from src.lib.exceptions import AppError
from src.schemas.speech import AsrOut, TtsIn

router = APIRouter(prefix="/v1/speech", tags=["speech"])


@router.post("/tts")
async def tts(body: TtsIn) -> Response:
    audio, content_type = await synthesize_speech(
        text=body.text,
        companion_id=body.companion_id,
    )
    if not audio:
        raise AppError("speech_upstream", "现在读不了，稍后再试", 502)
    return Response(content=audio, media_type=content_type or "audio/mpeg")


@router.post("/asr", response_model=AsrOut)
async def asr(file: UploadFile = File(...)) -> AsrOut:
    settings = get_settings()
    # Read at most max+1 bytes so oversized uploads fail without buffering unbounded data.
    limit = settings.speech_asr_max_bytes
    raw = await file.read(limit + 1)
    if not raw:
        raise AppError("validation_error", "没听到声音，再试一次吧", 400)
    if len(raw) > limit:
        raise AppError("validation_error", "这段话有点长，缩短一点再试试", 400)
    text = await transcribe_audio(
        audio=raw,
        filename=file.filename,
        content_type=file.content_type,
        settings=settings,
    )
    return AsrOut(text=text)
