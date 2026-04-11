"""
NyayaSetu — Inference Runner
============================
This is the single entry point for the full ML pipeline:

    Audio file  →  ASR  →  NER  →  BNS Classifier  →  Structured output

Two modes
─────────
  A) IndicBERT mode  : loads fine-tuned checkpoint (production)
  B) TF-IDF mode     : uses TF-IDF + rule engine (no GPU, works now)

Usage
─────
  # From Python
  from inference.run import NyayaSetuInference
  engine = NyayaSetuInference()
  result = engine.from_audio("complaint.wav")
  result = engine.from_text("Mere ghar mein chori hui...")

  # From CLI
  python inference/run.py --audio complaint.wav
  python inference/run.py --text "Mere ghar mein..."
  python inference/run.py --demo
"""

import sys
import os
import json
import time
import argparse
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from ..model.asr        import ASRModule
from ..model.ner_extractor import NERExtractor, IncidentEntities
from ..evidence_classifier.classifier import BNSClassifier, ClassificationResult, IndicBERTPredictor
from ..data.bns_sections import BNS_SECTIONS


# ══════════════════════════════════════════════════════════════════════════════
# OUTPUT SCHEMA
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class InferenceOutput:
    """
    Final structured output of the NyayaSetu ML pipeline.

    This is exactly what gets handed to any downstream consumer
    (police officer dashboard, victim app, FIR drafting system).
    """

    # ── Audio/text input ─────────────────────────────────────────────────────
    source:          str                    # "audio" | "text"
    raw_text:        str                    # complaint text (post-ASR if audio)
    asr_confidence:  Optional[float]        # Whisper confidence [0,1], None if text input

    # ── BNS Classification ───────────────────────────────────────────────────
    bns_sections:    List[str]              # e.g. ["BNS 305", "BNS 330"]
    primary_section: str                    # highest-confidence section
    confidence_scores: Dict[str, float]     # per-section sigmoid/cosine scores
    cognizable:      bool                   # can police arrest without warrant?
    bailable:        bool                   # is bail available as of right?
    ipc_equivalents: Dict[str, str]         # {"BNS 305": "IPC 380", ...}

    # ── Extracted Entities ───────────────────────────────────────────────────
    entities:        Dict                   # NER output (items, weapon, amount, evidence…)

    # ── Human-readable explanation (Hinglish) ────────────────────────────────
    explanation:     str

    # ── Victim rights ────────────────────────────────────────────────────────
    victim_rights:   List[str] = field(default_factory=list)

    # ── Metadata ─────────────────────────────────────────────────────────────
    processing_ms:   float = 0.0
    model_backend:   str   = "tfidf"        # "indicbert" | "tfidf"

    def to_dict(self) -> Dict:
        return {
            "source":           self.source,
            "raw_text":         self.raw_text,
            "asr_confidence":   self.asr_confidence,
            "bns_sections":     self.bns_sections,
            "primary_section":  self.primary_section,
            "confidence_scores": {k: round(v, 3) for k, v in self.confidence_scores.items()},
            "cognizable":       self.cognizable,
            "bailable":         self.bailable,
            "ipc_equivalents":  self.ipc_equivalents,
            "entities":         self.entities,
            "explanation":      self.explanation,
            "victim_rights":    self.victim_rights,
            "processing_ms":    self.processing_ms,
            "model_backend":    self.model_backend,
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=indent)

    def print_summary(self):
        """Pretty-print to terminal."""
        sep = "─" * 58
        print(f"\n{sep}")
        print(f"  NyayaSetu — Inference Result")
        print(sep)
        print(f"  Input       : {self.source.upper()}")
        if self.asr_confidence is not None:
            print(f"  ASR conf.   : {self.asr_confidence:.0%}")
        print(f"  Text        : {self.raw_text[:120]}{'…' if len(self.raw_text)>120 else ''}")
        print(sep)
        print(f"  BNS Sections: {', '.join(self.bns_sections)}")
        print(f"  Primary     : {self.primary_section} — {BNS_SECTIONS.get(self.primary_section,{}).get('title','')}")
        print(f"  IPC equiv.  : {', '.join(f'{v}→{k}' for k,v in self.ipc_equivalents.items())}")
        print(f"  Cognizable  : {'YES ⚠' if self.cognizable else 'No'}")
        print(f"  Bailable    : {'Yes' if self.bailable else 'NO ⚠'}")
        print(f"  Confidence  : { {k: f'{v:.2f}' for k,v in self.confidence_scores.items()} }")
        print(sep)
        print("  Entities:")
        for k, v in self.entities.items():
            if v:
                print(f"    {k:<22}: {v}")
        print(sep)
        print("  Explanation (Hinglish):")
        for line in self.explanation.split("\n"):
            if line.strip():
                print(f"    {line}")
        print(sep)
        print("  Victim Rights:")
        for r in self.victim_rights:
            print(f"    • {r}")
        print(sep)
        print(f"  Backend: {self.model_backend}  |  Time: {self.processing_ms:.1f} ms\n")


# ══════════════════════════════════════════════════════════════════════════════
# MAIN INFERENCE ENGINE
# ══════════════════════════════════════════════════════════════════════════════

class NyayaSetuInference:
    """
    The single unified inference engine.

    Automatically uses IndicBERT if a fine-tuned checkpoint exists,
    otherwise falls back to the TF-IDF + rule classifier.

    Both backends produce identical InferenceOutput structure.
    """

    def __init__(self, asr_model_size: str = "medium", force_tfidf: bool = False):
        self.asr         = ASRModule(model_size=asr_model_size)
        self.ner         = NERExtractor()
        self._indicbert  = IndicBERTPredictor()
        self._tfidf_clf  = None    # lazy init
        self._force_tfidf = force_tfidf

    # ── Backend selection ─────────────────────────────────────────────────────

    def _get_backend(self) -> str:
        is_avail = self._indicbert.is_available()
        force = self._force_tfidf
        if not force and is_avail:
            backend = "indicbert"
        else:
            backend = "rule-based"
        return backend

    # ── Classification dispatch ───────────────────────────────────────────────

    def _classify(
        self, text: str, entities: IncidentEntities
    ) -> Tuple[List[str], str, Dict[str, float], bool, bool, Dict[str, str], str]:
        """
        Returns:
          sections, primary, scores, cognizable, bailable, ipc_equiv, explanation, backend
        """
        # Use unified BNSClassifier (handles both IndicBERT and fallback)
        clf = BNSClassifier()
        clf_result = clf.predict(text, entities)
        
        sections   = clf_result.bns_sections
        primary    = clf_result.primary_section
        scores     = clf_result.confidence_scores
        cognizable = clf_result.cognizable
        bailable   = clf_result.bailable
        ipc_equiv  = clf_result.ipc_equivalents
        explanation = clf_result.explanation
        
        # Determine backend used (check IndicBERT availability)
        backend = "indicbert" if self._indicbert.is_available() and not self._force_tfidf else "rule-based"

        return sections, primary, scores, cognizable, bailable, ipc_equiv, explanation, backend

    # ── Victim rights ─────────────────────────────────────────────────────────

    def _get_rights(self, cognizable: bool, bailable: bool, entities: Dict) -> List[str]:
        rights = [
            "Aapko FREE mein FIR darj karwane ka adhikar hai (CrPC Section 154).",
            "Police aapko FIR ki ek copy dene ke liye bound hai.",
            "Aap kisi bhi police station mein Zero FIR darj karwa sakte hain.",
        ]
        if cognizable:
            rights.append(
                "Yeh cognizable offense hai — police bina warrant ke accused ko arrest kar sakti hai."
            )
        if not bailable:
            rights.append(
                "Yeh non-bailable offense hai — accused ko bail ke liye court jaana hoga."
            )
        if entities.get("evidence"):
            rights.append(
                f"Apna evidence ({', '.join(entities['evidence'])}) surakshit rakhein — case ke liye zaroori hai."
            )
        if entities.get("amount_lost"):
            rights.append(
                "Bank se transaction history aur statement lein — financial fraud ke liye crucial hai."
            )
        return rights

    # ══════════════════════════════════════════════════════════════════════════
    # PUBLIC INTERFACES
    # ══════════════════════════════════════════════════════════════════════════

    def from_audio(
        self,
        audio_path:  str,
        language:    str = "hi",
    ) -> InferenceOutput:
        """
        Full pipeline: audio file → BNS sections.

        Args:
            audio_path : path to .wav / .mp3 / .ogg / .flac
            language   : "hi" (Hindi), "en" (English), None (auto-detect)
        """
        t0 = time.perf_counter()

        # Stage 1 — ASR
        raw_text, asr_conf = self.asr.transcribe(audio_path, language=language)

        # Stage 2-4 — NER + classify
        result = self._run_pipeline(raw_text, source="audio", asr_conf=asr_conf)
        result.processing_ms = round((time.perf_counter() - t0) * 1000, 1)
        return result

    def from_audio_bytes(
        self,
        audio_bytes: bytes,
        suffix:      str = ".wav",
        language:    str = "hi",
    ) -> InferenceOutput:
        """For streaming/microphone input — pass raw bytes."""
        t0 = time.perf_counter()
        raw_text, asr_conf = self.asr.transcribe_bytes(audio_bytes, suffix, language)
        result = self._run_pipeline(raw_text, source="audio", asr_conf=asr_conf)
        result.processing_ms = round((time.perf_counter() - t0) * 1000, 1)
        return result

    def from_text(self, complaint_text: str) -> InferenceOutput:
        """
        Skip ASR — go straight from text to BNS sections.
        Use when complaint is typed or already transcribed.
        """
        t0 = time.perf_counter()
        result = self._run_pipeline(complaint_text, source="text", asr_conf=None)
        result.processing_ms = round((time.perf_counter() - t0) * 1000, 1)
        return result

    # ── Internal pipeline ─────────────────────────────────────────────────────

    def _run_pipeline(
        self, text: str, source: str, asr_conf: Optional[float]
    ) -> InferenceOutput:
        # Stage 2 — NER
        entities = self.ner.extract(text)

        # Stage 3 — BNS classification
        (
            sections, primary, scores,
            cognizable, bailable,
            ipc_equiv, explanation, backend
        ) = self._classify(text, entities)

        # Stage 4 — Victim rights
        ent_dict = entities.to_dict()
        rights   = self._get_rights(cognizable, bailable, ent_dict)

        return InferenceOutput(
            source           = source,
            raw_text         = text,
            asr_confidence   = asr_conf,
            bns_sections     = sections,
            primary_section  = primary,
            confidence_scores = scores,
            cognizable       = cognizable,
            bailable         = bailable,
            ipc_equivalents  = ipc_equiv,
            entities         = ent_dict,
            explanation      = explanation,
            victim_rights    = rights,
            model_backend    = backend,
        )


# ══════════════════════════════════════════════════════════════════════════════
# CLI
# ══════════════════════════════════════════════════════════════════════════════

DEMO_COMPLAINTS = [
    (
        "House theft + housebreaking",
        "Mere ghar mein kal raat koi ghus aaya. Main so raha tha tab darwaza tod ke "
        "andar aaya aur mera laptop, 15 hazaar cash aur biwi ke gold ke kangan le gaya. "
        "Subah uthke dekha to sab khatam. CCTV mein ek banda dikh raha hai kala jacket mein."
    ),
    (
        "Online UPI fraud",
        "Mujhe ek call aaya ki mera SBI account band hone wala hai. "
        "Unhone OTP maanga aur mere account se 45000 rupaye nikal liye."
    ),
    (
        "Knife robbery",
        "Main ATM se paisa nikal ke aa raha tha. Do ladke bike par aaye, "
        "chaku dikhaya aur mera purse cheen ke bhaag gaye. Purse mein 20000 cash tha."
    ),
    (
        "Child kidnapping",
        "Mera 8 saal ka beta kal school se wapas nahi aaya. "
        "Kisi ne usse force se ek white Maruti mein bethaya. CCTV footage available hai."
    ),
]


def cli():
    parser = argparse.ArgumentParser(
        description="NyayaSetu — Audio/Text → BNS Section Inference"
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--audio", type=str, help="Path to audio file (.wav/.mp3/.ogg)")
    group.add_argument("--text",  type=str, help="Raw complaint text (Hindi/Hinglish/English)")
    group.add_argument("--demo",  action="store_true", help="Run all demo complaints")

    parser.add_argument("--asr_model",  default="medium",
                        choices=["tiny","base","small","medium","large-v3"],
                        help="Whisper model size (default: medium)")
    parser.add_argument("--language",   default="hi",
                        help="ASR language code (default: hi)")
    parser.add_argument("--json",       action="store_true",
                        help="Output raw JSON instead of pretty-print")
    parser.add_argument("--force_tfidf", action="store_true",
                        help="Use TF-IDF classifier even if IndicBERT checkpoint exists")
    args = parser.parse_args()

    engine = NyayaSetuInference(
        asr_model_size = args.asr_model,
        force_tfidf    = args.force_tfidf,
    )

    if args.demo:
        for name, complaint in DEMO_COMPLAINTS:
            print(f"\n{'═'*58}")
            print(f"  DEMO: {name}")
            print('═'*58)
            result = engine.from_text(complaint)
            if args.json:
                print(result.to_json())
            else:
                result.print_summary()

    elif args.audio:
        result = engine.from_audio(args.audio, language=args.language)
        if args.json:
            print(result.to_json())
        else:
            result.print_summary()

    elif args.text:
        result = engine.from_text(args.text)
        if args.json:
            print(result.to_json())
        else:
            result.print_summary()


if __name__ == "__main__":
    cli()