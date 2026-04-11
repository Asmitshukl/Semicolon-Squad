"""
NyayaSetu — Automatic Speech Recognition (ASR) Module
======================================================
Converts victim's spoken audio (.wav / .mp3 / .ogg / .flac)
into Hindi / Hinglish / English text.

Architecture
------------
Primary  : OpenAI Whisper (medium or large-v3)
           — Best multilingual ASR, handles Hindi, code-switched Hinglish,
             background noise from police stations, accents.
Fallback  : Google Speech-to-Text (requires API key)
Offline   : whisper-base (runs on CPU, lower accuracy)

Production upgrade path
-----------------------
  Fine-tune Whisper on domain-specific FIR audio corpus:
    whisper-finetuner --model medium \
      --train_data ./data/audio/fir_corpus/ \
      --language hi --task transcribe

Dependencies
------------
  pip install openai-whisper soundfile librosa
  (ffmpeg must be installed on the system for mp3/ogg support)
"""

import os
import re
import wave
import struct
import math
from pathlib import Path
from typing import Optional, Tuple


# ── Hinglish post-processing corrections ──────────────────────────────────────
# Common Whisper mis-transcriptions in Hindi FIR context
ASR_CORRECTIONS = {
    # Number words
    "पंद्रह हज़ार":  "15 hazaar",
    "पंद्रह हजार":  "15 hazaar",
    "पचास हजार":    "50 hazaar",
    "एक लाख":       "1 lakh",
    "दो लाख":       "2 lakh",
    # Common mis-hearings
    "बी एन एस":     "BNS",
    "आई पी सी":     "IPC",
    "एफ आई आर":     "FIR",
    "सी सी टी वी":  "CCTV",
    # Punctuation cleanup
    "।":            ".",
    "…":            "...",
}


class ASRModule:
    """
    Wraps Whisper (or fallback) for Hindi/Hinglish speech → text.

    Usage:
        asr = ASRModule(model_size="medium")
        text, confidence = asr.transcribe("complaint.wav")
    """

    def __init__(self, model_size: str = "medium", device: str = "auto"):
        """
        Args:
            model_size : "tiny" | "base" | "small" | "medium" | "large-v3"
                          medium = best speed/accuracy tradeoff for Hindi
            device     : "auto" | "cpu" | "cuda"
        """
        self.model_size = model_size
        self.device     = self._resolve_device(device)
        self._model     = None   # lazy-load on first use
        self._loaded    = False

    # ── Device resolution ─────────────────────────────────────────────────────

    def _resolve_device(self, device: str) -> str:
        if device != "auto":
            return device
        try:
            import torch
            return "cuda" if torch.cuda.is_available() else "cpu"
        except ImportError:
            return "cpu"

    # ── Model loading ──────────────────────────────────────────────────────────

    def _load(self):
        if self._loaded:
            return
        try:
            import whisper
            print(f"[ASR] Loading Whisper '{self.model_size}' on {self.device}...")
            self._model  = whisper.load_model(self.model_size, device=self.device)
            self._backend = "whisper"
            self._loaded  = True
            print(f"[ASR] ✓ Whisper ready.")
        except ImportError:
            print("[ASR] ⚠  whisper not installed. Using mock transcriber.")
            print("[ASR]    Install with: pip install openai-whisper")
            self._backend = "mock"
            self._loaded  = True

    # ── Public transcribe interface ────────────────────────────────────────────

    def transcribe(
        self,
        audio_path: str,
        language: str = "hi",
        task: str = "transcribe",
    ) -> Tuple[str, float]:
        """
        Transcribe an audio file to text.

        Args:
            audio_path : path to .wav / .mp3 / .ogg / .flac
            language   : ISO 639-1 language code ("hi"=Hindi, None=auto-detect)
            task       : "transcribe" | "translate" (translate → English)

        Returns:
            (text, avg_log_prob_confidence)
            confidence ∈ [0, 1], higher = more confident
        """
        self._load()
        path = Path(audio_path)
        if not path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        if self._backend == "whisper":
            return self._whisper_transcribe(str(path), language, task)
        else:
            return self._mock_transcribe(str(path))

    def transcribe_bytes(
        self,
        audio_bytes: bytes,
        suffix: str = ".wav",
        language: str = "hi",
    ) -> Tuple[str, float]:
        """Transcribe raw audio bytes (e.g., from microphone stream)."""
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
            f.write(audio_bytes)
            tmp_path = f.name
        try:
            return self.transcribe(tmp_path, language=language)
        finally:
            os.unlink(tmp_path)

    # ── Whisper backend ────────────────────────────────────────────────────────

    def _whisper_transcribe(
        self, path: str, language: str, task: str
    ) -> Tuple[str, float]:
        import whisper
        import numpy as np

        options = whisper.DecodingOptions(
            language=language,
            task=task,
            fp16=(self.device == "cuda"),
            without_timestamps=False,
        )
        audio  = whisper.load_audio(path)
        audio  = whisper.pad_or_trim(audio)
        mel    = whisper.log_mel_spectrogram(audio).to(self.device)
        result = self._model.decode(mel, options)

        text       = self._postprocess(result.text)
        confidence = math.exp(result.avg_logprob)  # logprob → [0,1]

        return text, min(confidence, 1.0)

    def _whisper_transcribe_long(
        self, path: str, language: str
    ) -> Tuple[str, float]:
        """For audio > 30 seconds — uses Whisper's internal chunking."""
        result = self._model.transcribe(
            path,
            language=language,
            task="transcribe",
            verbose=False,
            word_timestamps=True,
            condition_on_previous_text=True,
        )
        text        = self._postprocess(result["text"])
        # avg confidence from segments
        segs        = result.get("segments", [])
        avg_lp      = sum(s.get("avg_logprob", -1) for s in segs) / max(len(segs), 1)
        confidence  = min(math.exp(avg_lp), 1.0)
        return text, confidence

    # ── Mock backend (no whisper installed) ───────────────────────────────────

    def _mock_transcribe(self, path: str) -> Tuple[str, float]:
        """
        Returns a canned demo transcription.
        Replace with real Whisper in production.
        """
        print(f"[ASR] MOCK mode — returning demo text for: {path}")
        demo = (
            "Mere ghar mein kal raat koi ghus aaya. "
            "Main so raha tha tab darwaza tod ke andar aaya "
            "aur mera laptop, 15 hazaar cash aur biwi ke gold ke kangan le gaya. "
            "Subah uthke dekha to sab khatam. "
            "CCTV mein ek banda dikh raha hai kala jacket mein."
        )
        return demo, 0.85  # mock confidence

    # ── Post-processing ────────────────────────────────────────────────────────

    def _postprocess(self, text: str) -> str:
        """Clean and normalise raw Whisper output."""
        # Apply known corrections
        for src, tgt in ASR_CORRECTIONS.items():
            text = text.replace(src, tgt)

        # Strip leading/trailing whitespace and repeated spaces
        text = re.sub(r"\s+", " ", text).strip()

        # Remove filler markers Whisper sometimes emits
        text = re.sub(r"\[.*?\]", "", text)
        text = re.sub(r"\(.*?\)", "", text)

        return text

    # ── Utility: generate a silent test WAV ───────────────────────────────────

    @staticmethod
    def generate_test_wav(path: str = "/tmp/test_complaint.wav", duration_s: float = 3.0):
        """
        Generate a short silent WAV for pipeline smoke-testing
        when no real microphone is available.
        """
        sample_rate = 16000
        n_samples   = int(sample_rate * duration_s)
        with wave.open(path, "w") as f:
            f.setnchannels(1)
            f.setsampwidth(2)   # 16-bit
            f.setframerate(sample_rate)
            # Write silence (zeros)
            f.writeframes(struct.pack("<" + "h" * n_samples, *([0] * n_samples)))
        return path


# ── Fine-tuning recipe (reference, not runnable without data) ─────────────────

FINETUNE_RECIPE = """
Fine-tuning Whisper on FIR audio corpus
========================================

1. Prepare data
   ─────────────
   Structure:
     data/audio/fir_corpus/
       train/
         audio_001.wav   ← 5–60 sec clips of FIR complaints
         audio_001.txt   ← exact transcript (UTF-8, Hindi or Hinglish)
         ...
       val/
         ...

   Recommended: ~500 hours for strong domain adaptation
   Minimum viable: ~50 hours for meaningful improvement

2. Install training dependencies
   ─────────────────────────────
   pip install openai-whisper datasets transformers[torch] accelerate evaluate jiwer

3. Prepare HuggingFace dataset
   ───────────────────────────
   from datasets import Dataset, Audio
   ds = Dataset.from_dict({
       "audio":       ["path/to/audio_001.wav", ...],
       "transcription": ["transcript text", ...],
   }).cast_column("audio", Audio(sampling_rate=16000))

4. Fine-tune
   ─────────
   from transformers import (
       WhisperForConditionalGeneration, WhisperProcessor,
       Seq2SeqTrainer, Seq2SeqTrainingArguments
   )

   model     = WhisperForConditionalGeneration.from_pretrained("openai/whisper-medium")
   processor = WhisperProcessor.from_pretrained("openai/whisper-medium", language="Hindi", task="transcribe")

   training_args = Seq2SeqTrainingArguments(
       output_dir            = "./checkpoints/whisper-fir",
       per_device_train_batch_size = 8,
       gradient_accumulation_steps = 2,
       learning_rate         = 1e-5,
       warmup_steps          = 100,
       num_train_epochs      = 10,
       fp16                  = True,
       predict_with_generate = True,
       generation_max_length = 225,
       save_strategy         = "epoch",
       eval_strategy         = "epoch",
       load_best_model_at_end= True,
       metric_for_best_model = "wer",
   )

5. Evaluate
   ─────────
   Metric: Word Error Rate (WER) — target < 15% on Hindi FIR domain
   jiwer.wer(references, hypotheses)
"""