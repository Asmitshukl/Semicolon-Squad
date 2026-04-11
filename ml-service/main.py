"""
NyayaSetu ML API

Wraps the `Vihaan-ML-2` package and exposes stable JSON contracts for the TS backend.
Falls back to lightweight keyword heuristics if the full Python stack is unavailable.
"""

from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, UploadFile
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parents[1]
VIHAAN_ROOT = ROOT / "Vihaan-ML-2"
if str(VIHAAN_ROOT) not in sys.path:
    sys.path.insert(0, str(VIHAAN_ROOT))

app = FastAPI(title="NyayaSetu ML", version="1.0.0")


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


def _heuristic_sections(text: str) -> list[dict[str, Any]]:
    lowered = text.lower()
    if any(word in lowered for word in ("theft", "stolen", "chori", "chori hui", "chor")):
        primary = "303"
        alt = "351"
    elif any(word in lowered for word in ("fraud", "otp", "cheating", "scam")):
        primary = "316"
        alt = "351"
    elif any(word in lowered for word in ("threat", "intimidation", "blackmail", "dhamki")):
        primary = "351"
        alt = "316"
    else:
        primary = "115"
        alt = "351"
    return [
        {"section_number": primary, "confidence": 0.81, "title": "Fallback primary"},
        {"section_number": alt, "confidence": 0.43, "title": "Fallback alternate"},
    ]


def _fallback_pipeline(raw_text: str, transcript: str, language: str) -> dict[str, Any]:
    classifications = _heuristic_sections(raw_text or transcript)
    primary = classifications[0]["section_number"]
    return {
        "transcript": transcript or raw_text,
        "raw_complaint_text": raw_text or transcript,
        "entities": {"language": language, "engine": "fallback"},
        "classifications": classifications,
        "primary_section_number": primary,
        "urgency_level": "HIGH" if primary in {"115", "75"} else "MEDIUM",
        "urgency_reason": "Fallback urgency based on detected complaint pattern.",
        "severity_score": classifications[0]["confidence"],
        "victim_rights": {
            "summary": "You can request a free FIR copy, preserve evidence, and use Zero FIR where applicable.",
            "bullets": [
                "Request your FIR copy or acknowledgment number.",
                "Preserve audio, screenshots, bills, and witness details.",
                "Use the nearest police station if jurisdiction is unclear.",
            ],
        },
        "model_version": "vihaan-fallback-v1",
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
    if ENGINE is None:
        transcript = raw_text.strip() or "[audio received - transcript unavailable in fallback mode]"
        return _fallback_pipeline(raw_text.strip(), transcript, language)

    suffix = Path(filename or "recording.wav").suffix or ".wav"
    try:
        output = ENGINE.from_audio_bytes(audio_bytes, suffix=suffix, language=language)
        payload = _output_to_payload(output, language=language)
        if raw_text.strip():
            payload["raw_complaint_text"] = raw_text.strip()
        return payload
    except Exception as exc:  # pragma: no cover - fallback path
        print(f"[ML] Audio pipeline failed, falling back: {exc}")
        transcript = raw_text.strip() or "[audio received - transcript unavailable in fallback mode]"
        return _fallback_pipeline(raw_text.strip(), transcript, language)


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "engine": "vihaan" if ENGINE is not None else "fallback",
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
    audio_bytes = await audio.read()
    payload = _run_audio_pipeline(audio_bytes, audio.filename or "recording.wav", language)
    return {
        "transcript": payload["transcript"],
        "language": language,
        "model_version": payload["model_version"],
    }
