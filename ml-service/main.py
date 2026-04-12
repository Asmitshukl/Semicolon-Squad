"""
NyayaSetu ML API

Wraps the Vihaan-ML-2 package and exposes stable JSON contracts for the TS backend.
Falls back to lightweight keyword heuristics if the full Python stack is unavailable.
Always transcribes audio via openai-whisper small (best balance of speed and accuracy
for Hindi/Hinglish/English on CPU).
"""

from __future__ import annotations

import io
import os
import sys
import tempfile
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parents[1]
VIHAAN_ROOT = ROOT / "Vihaan-ML-2"
if str(VIHAAN_ROOT) not in sys.path:
    sys.path.insert(0, str(VIHAAN_ROOT))

# ── Whisper lazy-loader ─────────────────────────────────────────────
# large-v3: best Whisper model for Hindi / English / Hinglish (code-switching)
# Automatically uses CUDA (GPU) if available, otherwise CPU.
_WHISPER_MODEL = None
_WHISPER_AVAILABLE = False
_WHISPER_DEVICE = "cpu"
_WHISPER_USE_FP16 = False

# small   : 474 MB  — fast on CPU
# medium  : 1.5 GB  — higher accuracy
# large-v3: 3 GB    — best accuracy for Hindi/Hinglish/English (requires GPU or 8GB+ RAM)
WHISPER_MODEL_NAME = os.getenv("NYAYASETU_WHISPER_MODEL", "medium")


def _detect_device() -> tuple[str, bool]:
    try:
        import torch
        if torch.cuda.is_available():
            gpu = torch.cuda.get_device_name(0)
            print(f"[Whisper] CUDA GPU detected: {gpu} — using GPU with fp16")
            return "cuda", True
    except Exception:
        pass
    print("[Whisper] No CUDA GPU detected — using CPU with fp32")
    return "cpu", False


def _load_whisper():
    global _WHISPER_MODEL, _WHISPER_AVAILABLE, _WHISPER_DEVICE, _WHISPER_USE_FP16
    if _WHISPER_AVAILABLE:
        return _WHISPER_MODEL
    try:
        import whisper  # openai-whisper
        device, use_fp16 = _detect_device()
        _WHISPER_DEVICE = device
        _WHISPER_USE_FP16 = use_fp16
        print(f"[Whisper] Loading {WHISPER_MODEL_NAME} on {device} …")
        _WHISPER_MODEL = whisper.load_model(WHISPER_MODEL_NAME, device=device)
        _WHISPER_AVAILABLE = True
        print(f"[Whisper] {WHISPER_MODEL_NAME} loaded successfully on {device}.")
    except Exception as exc:
        print(f"[Whisper] Failed to load: {exc}")
        _WHISPER_MODEL = None
        _WHISPER_AVAILABLE = False
    return _WHISPER_MODEL


def _whisper_transcribe_bytes(audio_bytes: bytes, filename: str, language: str) -> str:
    """Transcribe audio bytes to English using Whisper large-v3 (best for Hindi/Hinglish)."""
    model = _load_whisper()
    if model is None:
        return ""
    try:
        suffix = Path(filename or "recording.webm").suffix or ".webm"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        try:
            # task="translate" → always outputs English regardless of input language
            # language=None   → auto-detect (handles Hinglish code-switching better)
            result = model.transcribe(
                tmp_path,
                task="translate",
                language=None,
                fp16=_WHISPER_USE_FP16,
                temperature=0.0,
                best_of=1,
                beam_size=3,              # reduced from 5 for faster CPU inference
                condition_on_previous_text=True,
            )
            text = (result.get("text") or "").strip()
            detected_lang = result.get("language", "unknown")
            print(f"[Whisper] Detected language: {detected_lang} | Transcribed {len(audio_bytes)} bytes → {len(text)} chars")
            return text
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
    except Exception as exc:
        print(f"[Whisper] Transcription error: {exc}")
        return ""


# Eagerly load model in background thread at startup
import threading
threading.Thread(target=_load_whisper, daemon=True).start()

app = FastAPI(title="NyayaSetu ML", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # allow browser calls from any localhost port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PipelineJsonBody(BaseModel):
    raw_text: str = ""
    rawComplaintText: str | None = None
    language: str = "hi"


class ClassifyJsonBody(BaseModel):
    raw_text: str = ""
    rawComplaintText: str | None = None
    language: str = "hi"


def _clean_section(value: str | None) -> str:
    if not value:
        return ""
    cleaned = value.replace("BNS", "").replace("§", "").strip()
    return cleaned


# BNS section metadata — section_number, title, ipc_equivalent, cognizable, bailable
BNS_SECTION_META: dict[str, dict] = {
    "309": {"title": "Robbery", "ipc": "390", "cognizable": True, "bailable": False},
    "310": {"title": "Dacoity", "ipc": "391", "cognizable": True, "bailable": False},
    "303": {"title": "Theft", "ipc": "379", "cognizable": True, "bailable": False},
    "304": {"title": "Theft in dwelling house", "ipc": "380", "cognizable": True, "bailable": False},
    "316": {"title": "Cheating and dishonestly inducing delivery of property", "ipc": "420", "cognizable": True, "bailable": False},
    "351": {"title": "Criminal intimidation", "ipc": "506", "cognizable": True, "bailable": True},
    "115": {"title": "Voluntarily causing hurt", "ipc": "323", "cognizable": False, "bailable": True},
    "117": {"title": "Voluntarily causing grievous hurt", "ipc": "325", "cognizable": True, "bailable": False},
    "140": {"title": "Assault or criminal force to woman with intent to outrage her modesty", "ipc": "354", "cognizable": True, "bailable": False},
    "137": {"title": "Kidnapping", "ipc": "363", "cognizable": True, "bailable": False},
    "103": {"title": "Murder", "ipc": "302", "cognizable": True, "bailable": False},
    "318": {"title": "Fraud", "ipc": "415", "cognizable": True, "bailable": False},
    "324": {"title": "Mischief causing damage", "ipc": "427", "cognizable": False, "bailable": True},
}


def _heuristic_sections(text: str) -> list[dict[str, Any]]:
    lowered = text.lower()
    matched: list[tuple[str, float]] = []  # (section_number, confidence)

    # Robbery / looting (highest priority — armed theft)
    if any(w in lowered for w in ("loot", "looted", "looting", "snatch", "snatched", "rob", "robbed", "chheena", "loot liya")):
        matched.append(("309", 0.88))
    # Theft / stealing
    if any(w in lowered for w in ("stole", "stolen", "steal", "theft", "chori", "churaya", "le gaya", "le gaye")):
        matched.append(("303", 0.82))
    # House / dwelling theft
    if any(w in lowered for w in ("ghar mein", "house", "flat", "room", "dwelling", "andar ghus")):
        if any(w in lowered for w in ("stole", "stolen", "chori", "theft", "loot", "le gaya")):
            matched.append(("304", 0.79))
    # Murder / attempt to murder
    if any(w in lowered for w in ("murder", "killed", "maar diya", "maut", "death", "hatya", "qatl")):
        matched.append(("103", 0.95))
    # Grievous hurt
    if any(w in lowered for w in ("fracture", "hospital", "serious injury", "grievous", "haddi", "toot gaya", "blood", "khoon")):
        matched.append(("117", 0.75))
    # Simple hurt / assault
    elif any(w in lowered for w in ("beat", "beaten", "assault", "hit", "slap", "punch", "maar", "peet", "thappad", "laat")):
        matched.append(("115", 0.68))
    # Online fraud / cheating
    if any(w in lowered for w in ("fraud", "scam", "otp", "upi", "online", "cheating", "bank call", "investment", "fake", "dhoka")):
        matched.append(("316", 0.84))
        matched.append(("318", 0.65))
    # Threat / intimidation
    if any(w in lowered for w in ("threat", "threats", "threatened", "dhamki", "maar dunga", "jaan se", "blackmail")):
        matched.append(("351", 0.72))
    # Kidnapping
    if any(w in lowered for w in ("kidnap", "kidnapped", "abduct", "apaharan", "uthaya", "le gaye", "forcibly taken")):
        matched.append(("137", 0.86))
    # Molestation / outrage modesty
    if any(w in lowered for w in ("molest", "molestation", "outrage", "touch", "chhed", "chheda")):
        matched.append(("140", 0.82))

    # Deduplicate by section number, keep highest confidence
    seen: dict[str, float] = {}
    for sec, conf in matched:
        if sec not in seen or conf > seen[sec]:
            seen[sec] = conf

    if not seen:
        # Generic fallback
        seen = {"115": 0.45, "351": 0.35}

    results = []
    for sec, conf in sorted(seen.items(), key=lambda x: -x[1]):
        meta = BNS_SECTION_META.get(sec, {"title": f"BNS Section {sec}", "ipc": None, "cognizable": True, "bailable": False})
        results.append({
            "section_number": sec,
            "confidence": conf,
            "title": meta["title"],
            "ipc_equivalent": meta.get("ipc"),
            "cognizable": meta["cognizable"],
            "bailable": meta["bailable"],
        })

    return results


def _fallback_pipeline(raw_text: str, transcript: str, language: str) -> dict[str, Any]:
    classifications = _heuristic_sections(raw_text or transcript)
    primary = classifications[0]["section_number"]
    primary_meta = BNS_SECTION_META.get(primary, {})
    is_non_bailable = not primary_meta.get("bailable", False)
    ipc_equivalents = {c["section_number"]: c["ipc_equivalent"] for c in classifications if c.get("ipc_equivalent")}
    return {
        "transcript": transcript or raw_text,
        "raw_complaint_text": raw_text or transcript,
        "entities": {
            "language": language,
            "engine": "heuristic",
            "cognizable": primary_meta.get("cognizable", True),
            "bailable": primary_meta.get("bailable", False),
            "ipc_equivalents": ipc_equivalents,
        },
        "classifications": classifications,
        "primary_section_number": primary,
        "urgency_level": "HIGH" if is_non_bailable else "MEDIUM",
        "urgency_reason": f"BNS §{primary} — {primary_meta.get('title', 'Section')} is {'non-bailable' if is_non_bailable else 'bailable'}.",
        "severity_score": classifications[0]["confidence"],
        "victim_rights": {
            "summary": "You can request a free FIR copy, preserve evidence, and use Zero FIR where applicable.",
            "bullets": [
                "Request your FIR copy or acknowledgment number.",
                "Preserve audio, screenshots, bills, and witness details.",
                "Use the nearest police station if jurisdiction is unclear.",
            ],
        },
        "model_version": "nyayasetu-heuristic-v2",
    }



def _build_engine():
    try:
        from nyayasetu_ml.inference.run import NyayaSetuInference

        asr_model = os.getenv("NYAYASETU_ASR_MODEL", "medium")
        force_tfidf = os.getenv("NYAYASETU_FORCE_TFIDF", "false").lower() in {"1", "true", "yes"}
        return NyayaSetuInference(asr_model_size=asr_model, force_tfidf=force_tfidf)
    except Exception as exc:  # pragma: no cover - fallback path
        print(f"[ML] Vihaan engine unavailable, using fallback pipeline: {exc}")
        return None


ENGINE = _build_engine()


def _output_to_payload(output: Any, *, language: str, transcript_override: str | None = None) -> dict[str, Any]:
    sections = list(getattr(output, "bns_sections", []) or [])
    scores = dict(getattr(output, "confidence_scores", {}) or {})
    entities_obj = getattr(output, "entities", {}) or {}
    if hasattr(entities_obj, "to_dict"):
        entities = entities_obj.to_dict()
    elif isinstance(entities_obj, dict):
        entities = entities_obj
    else:
        entities = {}

    classifications = []
    for section in sections:
        key = section if section in scores else _clean_section(section)
        classifications.append(
            {
                "section_number": _clean_section(section),
                "confidence": float(scores.get(section, scores.get(key, 0.5))),
                "title": None,
            }
        )

    primary_section = _clean_section(getattr(output, "primary_section", "") or (sections[0] if sections else ""))
    if not classifications and primary_section:
        classifications.append({"section_number": primary_section, "confidence": 0.5, "title": None})

    max_conf = max((item["confidence"] for item in classifications), default=0.5)
    urgency = "HIGH" if not getattr(output, "bailable", True) else "MEDIUM"
    if getattr(output, "cognizable", False) and max_conf >= 0.8:
        urgency = "HIGH"

    rights = list(getattr(output, "victim_rights", []) or [])
    explanation = getattr(output, "explanation", "") or ""

    return {
        "transcript": transcript_override or getattr(output, "raw_text", "") or "",
        "raw_complaint_text": getattr(output, "raw_text", "") or transcript_override or "",
        "entities": {
            **entities,
            "explanation": explanation,
            "ipc_equivalents": getattr(output, "ipc_equivalents", {}) or {},
            "cognizable": getattr(output, "cognizable", False),
            "bailable": getattr(output, "bailable", True),
            "language": language,
        },
        "classifications": classifications,
        "primary_section_number": primary_section,
        "urgency_level": urgency,
        "urgency_reason": explanation.splitlines()[-1] if explanation else "Priority suggested by Vihaan-ML-2.",
        "severity_score": max_conf,
        "victim_rights": {
            "summary": rights[0] if rights else "Victim rights guidance available.",
            "bullets": rights,
        },
        "model_version": f"vihaan-{getattr(output, 'model_backend', 'engine')}",
    }


def _run_text_pipeline(text: str, language: str) -> dict[str, Any]:
    clean_text = text.strip()
    if not clean_text:
        return _fallback_pipeline("", "", language)
    if ENGINE is None:
        return _fallback_pipeline(clean_text, clean_text, language)
    try:
        output = ENGINE.from_text(clean_text)
        return _output_to_payload(output, language=language, transcript_override=clean_text)
    except Exception as exc:  # pragma: no cover - fallback path
        print(f"[ML] Text pipeline failed, falling back: {exc}")
        return _fallback_pipeline(clean_text, clean_text, language)


def _run_audio_pipeline(audio_bytes: bytes, filename: str, language: str, raw_text: str = "") -> dict[str, Any]:
    # ── Step 1: Always attempt Whisper transcription first ──────────
    whisper_transcript = _whisper_transcribe_bytes(audio_bytes, filename, language)
    transcript = whisper_transcript or raw_text.strip()

    # ── Step 2: Try full Vihaan engine (uses its own Whisper internally) ─
    if ENGINE is not None:
        suffix = Path(filename or "recording.wav").suffix or ".wav"
        try:
            output = ENGINE.from_audio_bytes(audio_bytes, suffix=suffix, language=language)
            payload = _output_to_payload(output, language=language)
            # Always prefer our standalone Whisper transcript as it's more reliable
            if transcript:
                payload["transcript"] = transcript
                payload["raw_complaint_text"] = transcript
            return payload
        except Exception as exc:
            print(f"[ML] Vihaan audio pipeline failed, using fallback: {exc}")

    # ── Step 3: Fallback — use Whisper transcript + heuristic BNS ──
    if not transcript:
        transcript = "[No audio received or transcription unavailable]"

    return _fallback_pipeline(transcript, transcript, language)



@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "engine": "vihaan" if ENGINE is not None else "fallback",
        "whisper_model": WHISPER_MODEL_NAME,
        "whisper_device": _WHISPER_DEVICE,
        "whisper_status": "loaded" if _WHISPER_AVAILABLE else "loading",
        "vihaan_root": str(VIHAAN_ROOT),
    }



@app.post("/v1/pipeline/json")
async def pipeline_json(payload: PipelineJsonBody) -> dict[str, Any]:
    text = (payload.rawComplaintText or payload.raw_text or "").strip()
    return _run_text_pipeline(text, payload.language)


@app.post("/v1/pipeline")
async def pipeline_multipart(
    audio: UploadFile | None = File(default=None),
    language: str = Form("hi"),
    raw_text: str = Form(""),
    rawComplaintText: str = Form(""),
) -> dict[str, Any]:
    text = (rawComplaintText or raw_text or "").strip()
    if audio is None:
        return _run_text_pipeline(text, language)
    audio_bytes = await audio.read()
    return _run_audio_pipeline(audio_bytes, audio.filename or "recording.wav", language, text)


@app.post("/v1/classify")
async def classify(payload: ClassifyJsonBody) -> dict[str, Any]:
    text = (payload.rawComplaintText or payload.raw_text or "").strip()
    pipeline = _run_text_pipeline(text, payload.language)
    return {
        "classifications": pipeline["classifications"],
        "primary_section_number": pipeline["primary_section_number"],
        "urgency_level": pipeline["urgency_level"],
        "urgency_reason": pipeline["urgency_reason"],
        "severity_score": pipeline["severity_score"],
        "model_version": pipeline["model_version"],
    }


@app.post("/v1/transcribe")
async def transcribe(audio: UploadFile = File(...), language: str = Form("hi")) -> dict[str, Any]:
    try:
        audio_bytes = await audio.read()
        if not audio_bytes:
            return {"transcript": "", "language": language, "model_version": "whisper-small", "error": "empty audio"}
        payload = _run_audio_pipeline(audio_bytes, audio.filename or "recording.wav", language)
        return {
            "transcript": payload["transcript"],
            "language": language,
            "model_version": payload["model_version"],
        }
    except Exception as exc:
        print(f"[transcribe] Error: {exc}")
        return {"transcript": "", "language": language, "model_version": "whisper-small", "error": str(exc)}
