"""
NyayaSetu — BNS Multi-Label Section Classifier (IndicBERT)

Uses fine-tuned IndicBERT transformer for multi-label BNS section classification.
Falls back to TF-IDF + rule engine if model checkpoint not found.
"""

import re
import sys
import json
import pickle
from pathlib import Path
from typing import List, Dict, Tuple
from dataclasses import dataclass

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ..data.bns_sections import BNS_SECTIONS, CRIME_CATEGORY_RULES
from ..model.ner_extractor import IncidentEntities

# Optional: transformers/torch
try:
    import torch
    from transformers import AutoTokenizer, AutoModelForSequenceClassification

    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


# ══════════════════════════════════════════════════════════════════════════════
# RESULT CONTAINER
# ══════════════════════════════════════════════════════════════════════════════


@dataclass
class ClassificationResult:
    bns_sections: List[str]
    primary_section: str
    confidence_scores: Dict[str, float]
    cognizable: bool
    bailable: bool
    explanation: str
    ipc_equivalents: Dict[str, str]
    entities: IncidentEntities

    def to_dict(self):
        return {
            "bns_sections": self.bns_sections,
            "primary_section": self.primary_section,
            "cognizable": self.cognizable,
            "bailable": self.bailable,
            "confidence_scores": {k: round(v, 3) for k, v in self.confidence_scores.items()},
            "explanation": self.explanation,
            "ipc_equivalents": self.ipc_equivalents,
            "entities": self.entities.to_dict(),
        }


# ══════════════════════════════════════════════════════════════════════════════
# INDICBERT PREDICTOR
# ══════════════════════════════════════════════════════════════════════════════


class IndicBERTPredictor:
    """
    Loads fine-tuned IndicBERT checkpoint and runs inference.
    """

    CHECKPOINT_DIR = Path(__file__).parent.parent / "checkpoints" / "bns_classifier"
    ENCODER_PATH = Path(__file__).parent.parent / "checkpoints" / "label_encoder.pkl"
    CONFIG_PATH = Path(__file__).parent.parent / "checkpoints" / "bns_config.json"
    THRESHOLD = 0.5

    def __init__(self):
        self._loaded = False
        self.tokenizer = None
        self.model = None
        self.mlb = None
        self.config = None

    def is_available(self) -> bool:
        """Check if fine-tuned checkpoint exists."""
        return (
            self.CHECKPOINT_DIR.exists()
            and self.ENCODER_PATH.exists()
            and self.CONFIG_PATH.exists()
        )

    def load(self):
        """Load fine-tuned model, tokenizer, and label encoder."""
        if self._loaded:
            return

        if not TORCH_AVAILABLE:
            raise RuntimeError("torch and transformers required")

        # ── Download from HuggingFace Hub if checkpoint not found locally ──
        if not self.is_available():
            try:
                from huggingface_hub import snapshot_download
                import os

                print("[IndicBERT] Checkpoint not found locally. Downloading from HuggingFace Hub...")
                snapshot_download(
                    repo_id="Uday1004/bns-classifier",
                    local_dir=str(self.CHECKPOINT_DIR),
                    token=os.getenv("HF_TOKEN")
                )
                print("[IndicBERT] ✓ Download complete.")
            except Exception as e:
                raise FileNotFoundError(
                    f"Could not download IndicBERT checkpoint: {e}\n"
                    f"Set HF_TOKEN in your .env and ensure 'Uday1004/bns-classifier' exists on HuggingFace."
                )

        try:
            print("[IndicBERT] Loading fine-tuned checkpoint...")
            self.tokenizer = AutoTokenizer.from_pretrained(str(self.CHECKPOINT_DIR))
            self.model = AutoModelForSequenceClassification.from_pretrained(
                str(self.CHECKPOINT_DIR)
            )
            self.model.eval()

            with open(self.ENCODER_PATH, "rb") as f:
                self.mlb = pickle.load(f)

            with open(self.CONFIG_PATH, "r") as f:
                self.config = json.load(f)

            self._loaded = True
            print("[IndicBERT] ✓ Ready.")

        except Exception as e:
            raise RuntimeError(f"Failed to load IndicBERT checkpoint: {e}")

    def predict(
        self, text: str, threshold: float = None
    ) -> Tuple[List[str], Dict[str, float]]:
        """
        Predict BNS sections for given text.

        Returns:
          sections: List of predicted BNS section codes
          scores:   Dict mapping section → confidence score
        """
        self.load()

        if threshold is None:
            threshold = self.THRESHOLD

        # Tokenize
        encoding = self.tokenizer(
            text,
            max_length=256,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )

        # Inference
        with torch.no_grad():
            logits = self.model(
                input_ids=encoding["input_ids"],
                attention_mask=encoding["attention_mask"],
            ).logits

        # Sigmoid probabilities
        probs = torch.sigmoid(logits).cpu().numpy()[0]

        # Get predictions above threshold
        active = (probs >= threshold).astype(int)
        sections = list(self.mlb.inverse_transform(active.reshape(1, -1))[0])

        # Build scores dict
        scores = {
            sec: float(probs[i])
            for i, sec in enumerate(self.mlb.classes_)
            if probs[i] >= threshold * 0.5  # include near-threshold for transparency
        }

        # Sort by score descending
        sections = sorted(sections, key=lambda s: scores.get(s, 0), reverse=True)

        # Fallback: if no sections, pick top-1
        if not sections and len(probs) > 0:
            import numpy as np

            best_idx = int(np.argmax(probs))
            sections = [self.mlb.classes_[best_idx]]
            scores[sections[0]] = float(probs[best_idx])

        return sections, scores


# ══════════════════════════════════════════════════════════════════════════════
# BNS CLASSIFIER (UNIFIED INTERFACE)
# ══════════════════════════════════════════════════════════════════════════════


class BNSClassifier:
    """
    Multi-label BNS section classifier.

    Automatically uses fine-tuned IndicBERT if checkpoint exists,
    otherwise falls back to rule-based reasoning.
    """

    def __init__(self):
        self._indicbert = IndicBERTPredictor()
        self._use_indicbert = self._indicbert.is_available()

    def predict(
        self, text: str, entities: IncidentEntities
    ) -> ClassificationResult:
        """
        Classify complaint text into BNS sections.

        Args:
          text:     Raw complaint text
          entities: NER-extracted entities

        Returns:
          ClassificationResult with sections, scores, cognizability, explanation
        """

        if self._use_indicbert:
            return self._predict_indicbert(text, entities)
        else:
            print("[WARN] IndicBERT checkpoint not found. Using fallback rules.")
            return self._predict_rules(text, entities)

    def _predict_indicbert(
        self, text: str, entities: IncidentEntities
    ) -> ClassificationResult:
        """Predict using fine-tuned IndicBERT."""
        try:
            sections, scores = self._indicbert.predict(text)

            if not sections:
                sections = ["BNS 303"]  # Default to theft

            primary = sections[0]

            # Get metadata
            meta = BNS_SECTIONS.get(primary, {})
            cognizable = meta.get("cognizable", False)
            bailable = meta.get("bailable", True)

            ipc_equiv = {
                s: BNS_SECTIONS.get(s, {}).get("ipc_equiv", "N/A") for s in sections
            }

            # Generate explanation
            explanation = self._generate_explanation(sections, entities, text)

            return ClassificationResult(
                bns_sections=sections,
                primary_section=primary,
                confidence_scores=scores,
                cognizable=cognizable,
                bailable=bailable,
                explanation=explanation,
                ipc_equivalents=ipc_equiv,
                entities=entities,
            )

        except Exception as e:
            print(f"[ERROR] IndicBERT prediction failed: {e}")
            print("[FALLBACK] Using rule-based classifier...")
            return self._predict_rules(text, entities)

    def _predict_rules(
        self, text: str, entities: IncidentEntities
    ) -> ClassificationResult:
        """
        Rule-based fallback classifier.
        Simple keyword matching + entity heuristics.
        """

        text_lower = text.lower()
        entity_dict = entities.to_dict()

        # Score each section based on keywords
        scores = {}
        for sec, meta in BNS_SECTIONS.items():
            keywords = meta.get("keywords", [])
            matches = sum(1 for kw in keywords if kw.lower() in text_lower)
            scores[sec] = float(matches) / max(len(keywords), 1) if keywords else 0.0

        # Boost scores based on entities
        if entity_dict.get("items_stolen"):
            for item in entity_dict["items_stolen"]:
                if any(
                    kw in item.lower()
                    for kw in ["laptop", "cash", "gold", "jewel"]
                ):
                    scores["BNS 305"] = min(1.0, scores.get("BNS 305", 0) + 0.3)

        if entity_dict.get("weapon_used"):
            scores["BNS 194"] = min(1.0, scores.get("BNS 194", 0) + 0.4)

        if "online_fraud" in text_lower or "OTP" in text:
            scores["BNS 318"] = min(1.0, scores.get("BNS 318", 0) + 0.5)

        # Get top sections
        sorted_sections = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        sections = [sec for sec, score in sorted_sections if score > 0.1][:3]

        if not sections:
            sections = ["BNS 303"]

        primary = sections[0] if sections else "BNS 303"

        # Metadata
        meta = BNS_SECTIONS.get(primary, {})
        cognizable = meta.get("cognizable", False)
        bailable = meta.get("bailable", True)

        ipc_equiv = {
            s: BNS_SECTIONS.get(s, {}).get("ipc_equiv", "N/A") for s in sections
        }

        # Explanation
        explanation = self._generate_explanation(sections, entities, text)

        return ClassificationResult(
            bns_sections=sections,
            primary_section=primary,
            confidence_scores={s: scores.get(s, 0.0) for s in sections},
            cognizable=cognizable,
            bailable=bailable,
            explanation=explanation,
            ipc_equivalents=ipc_equiv,
            entities=entities,
        )

    def _generate_explanation(
        self, sections: List[str], entities: dict, text: str
    ) -> str:
        """Generate Hinglish explanation."""
        lines = []

        for i, sec in enumerate(sections, 1):
            meta = BNS_SECTIONS.get(sec, {})
            title = meta.get("title", "Unknown section")
            keywords = meta.get("keywords", [])

            reason = f"{title} laagu hota hai"

            # Match keywords in text
            matched = [kw for kw in keywords if kw.lower() in text.lower()]
            if matched:
                reason += f" kyunki {matched[0]} ("
                reason += (
                    meta.get("description", "").replace("Whoever", "").strip() + ")"
                )

            lines.append(f"{i}. **{sec} ({title})** — {reason}")

        cognizable = any(
            BNS_SECTIONS.get(sec, {}).get("cognizable", False) for sec in sections
        )
        bailable = all(
            BNS_SECTIONS.get(sec, {}).get("bailable", True) for sec in sections
        )

        if cognizable and not bailable:
            lines.append("\nYeh maamla **very serious** (non-bailable) hai.")
        elif cognizable:
            lines.append("\nYeh maamla **cognizable** hai (police arrest kar sakti hai).")
        else:
            lines.append("\nYeh maamla **non-cognizable** (bailable) hai.")

        return "\n".join(lines)
