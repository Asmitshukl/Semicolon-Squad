"""
Stub ML service for local integration testing.
Replace Whisper / NER / IndicBERT calls with your real models; keep the JSON response shape.
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, File, Form, UploadFile
from pydantic import BaseModel

app = FastAPI(title="NyayaSetu ML stub", version="0.1.0")


class PipelineJsonBody(BaseModel):
    raw_text: str = ""
    rawComplaintText: str | None = None
    language: str = "hi"


class ClassifyJsonBody(BaseModel):
    raw_text: str = ""
    rawComplaintText: str | None = None
    language: str = "hi"


def _demo_classifications(text: str) -> list[dict[str, Any]]:
    t = text.lower()
    if any(k in t for k in ("chori", "chor", "theft", "stolen", "चोरी")):
        primary = "303"
        alt = "351"
    elif any(k in t for k in ("threat", "blackmail", "extort", "धमकी")):
        primary = "351"
        alt = "303"
    else:
        primary = "115"
        alt = "351"
    return [
        {"section_number": primary, "confidence": 0.82, "title": "Stub primary"},
        {"section_number": alt, "confidence": 0.41, "title": "Stub alternate"},
    ]


def _pipeline_payload(*, transcript: str, raw_text: str, language: str) -> dict[str, Any]:
    classifications = _demo_classifications(raw_text)
    primary = classifications[0]["section_number"]
    return {
        "transcript": transcript or raw_text,
        "raw_complaint_text": raw_text,
        "entities": {"language": language, "note": "Replace with NER output"},
        "classifications": classifications,
        "primary_section_number": primary,
        "urgency_level": "HIGH" if primary == "115" else "MEDIUM",
        "urgency_reason": "Stub urgency from keyword heuristics — swap for model output.",
        "severity_score": classifications[0]["confidence"],
        "victim_rights": {
            "summary": "Stub victim-rights summary until your generator is wired.",
            "bullets": [
                "Preserve evidence and obtain an FIR acknowledgment.",
                "You may request a copy of your statement in your language where practicable.",
            ],
        },
        "model_version": "python-stub-v1",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/pipeline/json")
async def pipeline_json(payload: PipelineJsonBody) -> dict[str, Any]:
    text = (payload.rawComplaintText or payload.raw_text or "").strip()
    return _pipeline_payload(transcript=text, raw_text=text, language=payload.language)


@app.post("/v1/pipeline")
async def pipeline_multipart(
    audio: UploadFile | None = File(default=None),
    language: str = Form("hi"),
    raw_text: str = Form(""),
    rawComplaintText: str = Form(""),
) -> dict[str, Any]:
    """Multipart: optional `audio` (Whisper hook) plus optional text hints from the form."""
    transcript = ""
    if audio is not None:
        _ = await audio.read()
        transcript = f"[stub ASR] Received audio ({audio.filename}); connect Whisper here."
    text = (rawComplaintText or raw_text or "").strip()
    if not text:
        text = transcript or "[empty complaint]"
    if not transcript:
        transcript = text
    return _pipeline_payload(transcript=transcript, raw_text=text, language=language)


@app.post("/v1/classify")
async def classify(payload: ClassifyJsonBody) -> dict[str, Any]:
    text = (payload.rawComplaintText or payload.raw_text or "").strip()
    classifications = _demo_classifications(text)
    primary = classifications[0]["section_number"]
    return {
        "classifications": classifications,
        "primary_section_number": primary,
        "urgency_level": "HIGH" if primary == "115" else "MEDIUM",
        "urgency_reason": "Stub classify-only response.",
        "severity_score": classifications[0]["confidence"],
        "model_version": "python-stub-classify-v1",
    }
