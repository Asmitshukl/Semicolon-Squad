"""
NyayaSetu -- DistilBERT Multilingual Fine-tuning Script (v2 -- large dataset)
=============================================================================

Fine-tunes distilbert-base-multilingual-cased on BNS section multi-label
classification task using all available training data.

Data sources merged:
  1. nyayasetu_ml/data/training_data.py      (22 annotated samples)
  2. nyayasetu_ml/metadata/training_data.py  (curated)
  3. nyayasetu_ml/metadata/hinglish_complaints_cleaned.json (2188 samples)

Architecture:
  Model : distilbert-base-multilingual-cased (104 languages incl. Hindi/English)
  Task  : Multi-label BNS section classification
  Loss  : BCEWithLogitsLoss with per-class positive weights
  Input : up to 256 tokens
  Output: Probability per BNS section (sigmoid)

Usage:
  python training/train_indicbert.py --epochs 8 --batch_size 8
  python training/train_indicbert.py --eval_only

Requirements:
  pip install torch transformers scikit-learn
"""

import sys
import json
import hashlib
import pickle
import argparse
from pathlib import Path
from typing import List, Dict

import numpy as np

# -- Path setup ----------------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent          # nyayasetu_ml/
REPO_ROOT = ROOT.parent                                # ml-service/model/
sys.path.insert(0, str(ROOT))

# -- Import ML libs ------------------------------------------------------------
try:
    import torch
    import torch.nn.functional as F
    from torch.utils.data import Dataset, DataLoader
    from torch.optim import AdamW
    from transformers import (
        AutoTokenizer,
        AutoModelForSequenceClassification,
        get_cosine_schedule_with_warmup,
    )
    from sklearn.preprocessing import MultiLabelBinarizer
    ML_AVAILABLE = True
except ImportError as e:
    ML_AVAILABLE = False
    print(f"[ERROR] Missing dependencies: {e}")
    print("Install with: pip install torch transformers scikit-learn")
    sys.exit(1)

# -- Paths ---------------------------------------------------------------------
CHECKPOINT_DIR = ROOT / "checkpoints" / "bns_classifier"
ENCODER_PATH   = ROOT / "checkpoints" / "label_encoder.pkl"
CONFIG_PATH    = ROOT / "checkpoints" / "bns_config.json"

# Model: distilbert-base-multilingual-cased
# - Public, ungated, 104 languages (Hindi, English, and Hinglish transliteration)
# - ~250MB, fast on CPU, proven for multilingual NLP tasks
# - Fallback: same model (no separate fallback needed)
MODEL_NAME          = "distilbert-base-multilingual-cased"
FALLBACK_MODEL_NAME = "distilbert-base-multilingual-cased"
INFERENCE_THRESHOLD = 0.4   # lower threshold catches more sections (better recall)


# ??????????????????????????????????????????????????????????????????????????????
# DATA LOADING -- merges all available sources
# ??????????????????????????????????????????????????????????????????????????????

def _normalise_section(sec: str) -> str:
    """Strip 'BNS ' prefix and leading zeros for consistency."""
    s = str(sec).strip()
    if s.upper().startswith("BNS"):
        s = s[3:].strip()
    return s.lstrip("0") or "0"


def _normalise_record(record: dict) -> dict | None:
    """Return a normalised {text, sections} dict or None if unusable."""
    text = str(record.get("text") or "").strip()
    raw_secs = record.get("sections") or []
    if not text or not raw_secs:
        return None
    sections = [_normalise_section(s) for s in raw_secs if str(s).strip()]
    if not sections:
        return None
    return {"text": text, "sections": sections}


def load_all_training_data() -> List[dict]:
    """
    Merge all data sources, deduplicate by text hash, and return clean list.
    Sources loaded in order (later records do NOT overwrite earlier ones):
      1. data/training_data.py      -- curated 21 samples
      2. metadata/training_data.py  -- curated metadata samples
      3. metadata/hinglish_complaints_cleaned.json -- 2188 Hinglish samples
    """
    seen_hashes: set = set()
    merged: List[dict] = []

    def _add(records):
        for raw in records:
            norm = _normalise_record(raw)
            if norm is None:
                continue
            h = hashlib.md5(norm["text"].encode("utf-8", errors="replace")).hexdigest()
            if h in seen_hashes:
                continue
            seen_hashes.add(h)
            merged.append(norm)

    # -- Source 1: data/training_data.py --------------------------------------
    try:
        from data.training_data import TRAINING_DATA as DATA1
        _add(DATA1)
        print(f"  [data/training_data.py]      {len(DATA1)} records loaded")
    except ImportError as e:
        print(f"  [WARN] data/training_data.py not found: {e}")

    # -- Source 2: metadata/training_data.py ----------------------------------
    try:
        from metadata.training_data import TRAINING_DATA as DATA2
        before = len(merged)
        _add(DATA2)
        print(f"  [metadata/training_data.py]  {len(DATA2)} records loaded, {len(merged)-before} new")
    except ImportError as e:
        print(f"  [WARN] metadata/training_data.py not found: {e}")

    # -- Source 3: metadata/hinglish_complaints_cleaned.json ------------------
    json_path = ROOT / "metadata" / "hinglish_complaints_cleaned.json"
    if json_path.exists():
        try:
            with open(json_path, encoding="utf-8", errors="replace") as f:
                raw_json = json.load(f)
            before = len(merged)
            if isinstance(raw_json, list):
                _add(raw_json)
            elif isinstance(raw_json, dict):
                # handle {id: record} dicts
                _add(raw_json.values())
            print(f"  [hinglish_complaints.json]   {len(raw_json)} records loaded, {len(merged)-before} new")
        except Exception as e:
            print(f"  [WARN] Could not load hinglish JSON: {e}")
    else:
        print(f"  [WARN] hinglish_complaints_cleaned.json not found at {json_path}")

    return merged


# ??????????????????????????????????????????????????????????????????????????????
# DATASET
# ??????????????????????????????????????????????????????????????????????????????

class BNSDataset(Dataset):
    """Multi-label BNS section classification dataset."""

    def __init__(
        self,
        texts: List[str],
        labels: List[List[str]],
        tokenizer,
        mlb: MultiLabelBinarizer,
        max_length: int = 256,
    ):
        self.texts     = texts
        self.labels    = labels
        self.tokenizer = tokenizer
        self.mlb       = mlb
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        encoding = self.tokenizer(
            self.texts[idx],
            max_length=self.max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        label_vec = self.mlb.transform([self.labels[idx]])[0]
        return {
            "input_ids":      encoding["input_ids"].squeeze(),
            "attention_mask": encoding["attention_mask"].squeeze(),
            "labels":         torch.tensor(label_vec, dtype=torch.float32),
        }


# ??????????????????????????????????????????????????????????????????????????????
# CLASS WEIGHTS -- penalise rare classes more
# ??????????????????????????????????????????????????????????????????????????????

def compute_pos_weights(label_matrix: np.ndarray, clip_max: float = 10.0) -> torch.Tensor:
    """
    Per-class positive weight = (neg_count / pos_count), clipped to clip_max.
    Passed to BCEWithLogitsLoss(pos_weight=...) to handle class imbalance.
    """
    pos = label_matrix.sum(axis=0).astype(float)
    neg = label_matrix.shape[0] - pos
    weights = np.where(pos > 0, neg / pos, clip_max)
    weights = np.clip(weights, 1.0, clip_max)
    return torch.tensor(weights, dtype=torch.float32)


# ??????????????????????????????????????????????????????????????????????????????
# TRAINING LOOP
# ??????????????????????????????????????????????????????????????????????????????

def train_epoch(model, loader, optimizer, scheduler, device, pos_weights, label_smoothing=0.05):
    model.train()
    total_loss, n_batches = 0.0, 0
    pw = pos_weights.to(device)

    for batch in loader:
        input_ids      = batch["input_ids"].to(device)
        attention_mask = batch["attention_mask"].to(device)
        labels         = batch["labels"].to(device)

        # Label smoothing: push 1?(1-eps), 0?eps
        if label_smoothing > 0:
            labels = labels * (1.0 - label_smoothing) + (1 - labels) * label_smoothing

        optimizer.zero_grad()
        logits = model(input_ids=input_ids, attention_mask=attention_mask).logits
        loss   = F.binary_cross_entropy_with_logits(logits, labels, pos_weight=pw)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        scheduler.step()

        total_loss += loss.item()
        n_batches  += 1

    return total_loss / n_batches if n_batches > 0 else 0.0


def evaluate(model, loader, device, threshold: float = 0.4):
    model.eval()
    total_loss, n_batches = 0.0, 0
    all_preds, all_labels = [], []

    with torch.no_grad():
        for batch in loader:
            input_ids      = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels         = batch["labels"].to(device)
            logits = model(input_ids=input_ids, attention_mask=attention_mask).logits
            loss   = F.binary_cross_entropy_with_logits(logits, labels)
            total_loss += loss.item()
            n_batches  += 1
            probs = torch.sigmoid(logits)
            preds = (probs >= threshold).cpu().numpy()
            all_preds.extend(preds)
            all_labels.extend(labels.cpu().numpy())

    all_preds  = np.array(all_preds)
    all_labels = np.array(all_labels)

    tp = np.sum(all_preds * all_labels)
    fp = np.sum(all_preds * (1 - all_labels))
    fn = np.sum((1 - all_preds) * all_labels)
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall    = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1        = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
    exact     = np.mean(np.all(all_preds == all_labels, axis=1))

    return {
        "loss":        total_loss / n_batches if n_batches > 0 else 0.0,
        "precision":   precision,
        "recall":      recall,
        "f1":          f1,
        "exact_match": exact,
    }


# ??????????????????????????????????????????????????????????????????????????????
# MAIN TRAIN
# ??????????????????????????????????????????????????????????????????????????????

def train(
    epochs:        int   = 8,
    batch_size:    int   = 8,
    learning_rate: float = 3e-5,
    max_length:    int   = 256,
    seed:          int   = 42,
    warmup_ratio:  float = 0.10,
    label_smoothing: float = 0.05,
    val_ratio:     float = 0.15,
    patience:      int   = 5,
    device_str:    str   = "cuda" if torch.cuda.is_available() else "cpu",
):
    print(f"\n{'='*70}")
    print(f"  [NyayaSetu -- IndicBERT Fine-tuning  (v2 -- enhanced dataset)]")
    print(f"{'='*70}")
    print(f"  Model:            {MODEL_NAME}")
    print(f"  Epochs:           {epochs}")
    print(f"  Batch size:       {batch_size}")
    print(f"  Learning rate:    {learning_rate}")
    print(f"  Max length:       {max_length}")
    print(f"  Warmup:           {warmup_ratio*100:.0f}% of steps")
    print(f"  Label smoothing:  {label_smoothing}")
    print(f"  Val split:        {val_ratio*100:.0f}%")
    print(f"  Patience:         {patience}")
    print(f"  Device:           {device_str}")
    print(f"{'='*70}\n")

    torch.manual_seed(seed)
    np.random.seed(seed)
    device = torch.device(device_str)

    # -- 1. Load & merge all data ---------------------------------------------
    print("[1/5] Loading and merging training data from all sources...")
    records = load_all_training_data()
    print(f"\n  [OK] Total unique samples after deduplication: {len(records)}\n")

    if len(records) < 10:
        print("[ERROR] Too few samples to train (need at least 10).")
        sys.exit(1)

    texts    = [r["text"]     for r in records]
    labels   = [r["sections"] for r in records]

    all_sections = sorted(set(sec for label_list in labels for sec in label_list))
    print(f"  Unique BNS sections: {len(all_sections)}")
    print(f"  Sections: {all_sections[:20]}{'...' if len(all_sections)>20 else ''}\n")

    mlb = MultiLabelBinarizer(classes=all_sections)
    mlb.fit([all_sections])
    label_matrix = mlb.transform(labels)

    # -- 2. Model & Tokenizer -------------------------------------------------
    print(f"[2/5] Loading model and tokenizer: {MODEL_NAME}...")
    try:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        print("  [OK] Tokenizer: DistilBERT multilingual")
    except Exception as e:
        print(f"  [WARN] Tokenizer load failed ({e})")
        tokenizer = AutoTokenizer.from_pretrained(FALLBACK_MODEL_NAME)

    try:
        model = AutoModelForSequenceClassification.from_pretrained(
            MODEL_NAME,
            num_labels=len(all_sections),
            problem_type="multi_label_classification",
            ignore_mismatched_sizes=True,
        )
        print("  [OK] Model: DistilBERT multilingual")
    except Exception as e:
        print(f"  [WARN] Model load failed ({e})")
        model = AutoModelForSequenceClassification.from_pretrained(
            FALLBACK_MODEL_NAME,
            num_labels=len(all_sections),
            problem_type="multi_label_classification",
        )

    model.to(device)
    n_params = sum(p.numel() for p in model.parameters())
    print(f"  Parameters: {n_params:,}\n")

    # -- 3. Dataset split -----------------------------------------------------
    print("[3/5] Splitting dataset...")
    dataset    = BNSDataset(texts, labels, tokenizer, mlb, max_length)
    val_size   = max(1, int(val_ratio * len(dataset)))
    train_size = len(dataset) - val_size
    train_ds, val_ds = torch.utils.data.random_split(
        dataset,
        [train_size, val_size],
        generator=torch.Generator().manual_seed(seed),
    )
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader   = DataLoader(val_ds,   batch_size=batch_size, shuffle=False)
    print(f"  Training:   {train_size} samples")
    print(f"  Validation: {val_size} samples\n")

    # -- Per-class positive weights (class imbalance correction) --------------
    pos_weights = compute_pos_weights(label_matrix)

    # -- 4. Optimizer & cosine scheduler --------------------------------------
    print("[4/5] Setting up optimizer (AdamW + cosine schedule with warm-up)...")
    optimizer    = AdamW(model.parameters(), lr=learning_rate, weight_decay=0.01)
    total_steps  = len(train_loader) * epochs
    warmup_steps = int(warmup_ratio * total_steps)
    scheduler    = get_cosine_schedule_with_warmup(
        optimizer,
        num_warmup_steps=warmup_steps,
        num_training_steps=total_steps,
    )
    print(f"  Total steps:  {total_steps}")
    print(f"  Warmup steps: {warmup_steps}\n")

    # -- 5. Training loop ------------------------------------------------------
    print("[5/5] Training...\n")
    best_f1           = 0.0
    patience_counter  = 0
    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)

    for epoch in range(epochs):
        train_loss = train_epoch(
            model, train_loader, optimizer, scheduler, device,
            pos_weights, label_smoothing=label_smoothing,
        )
        val_metrics = evaluate(model, val_loader, device, threshold=INFERENCE_THRESHOLD)

        print(f"Epoch {epoch+1}/{epochs}")
        print(f"  Train loss : {train_loss:.4f}")
        print(f"  Val loss   : {val_metrics['loss']:.4f}")
        print(f"  Precision  : {val_metrics['precision']:.4f}")
        print(f"  Recall     : {val_metrics['recall']:.4f}")
        print(f"  F1         : {val_metrics['f1']:.4f}")
        print(f"  Exact match: {val_metrics['exact_match']:.2%}")

        if val_metrics["f1"] > best_f1:
            best_f1          = val_metrics["f1"]
            patience_counter = 0
            print("  [OK] New best -- saving checkpoint...\n")

            model.save_pretrained(str(CHECKPOINT_DIR))
            tokenizer.save_pretrained(str(CHECKPOINT_DIR))

            with open(ENCODER_PATH, "wb") as f:
                pickle.dump(mlb, f)

            with open(CONFIG_PATH, "w") as f:
                json.dump(
                    {
                        "model_name":    MODEL_NAME,
                        "num_labels":    len(all_sections),
                        "label_classes": all_sections,
                        "threshold":     INFERENCE_THRESHOLD,
                        "max_length":    max_length,
                        "total_samples": len(records),
                        "best_val_f1":   round(best_f1, 4),
                    },
                    f,
                    indent=2,
                )
        else:
            patience_counter += 1
            print(f"  (no improvement -- patience {patience_counter}/{patience})\n")
            if patience_counter >= patience:
                print(f"  [WARN] Early stopping triggered.\n")
                break

    print(f"{'='*70}")
    print(f"  [OK] Training complete!")
    print(f"  Best validation F1 : {best_f1:.4f}")
    print(f"  Total samples used : {len(records)}")
    print(f"  Checkpoint saved to: {CHECKPOINT_DIR}")
    print(f"{'='*70}\n")


# ??????????????????????????????????????????????????????????????????????????????
# CLI
# ??????????????????????????????????????????????????????????????????????????????

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Fine-tune IndicBERT on BNS section classification (v2)"
    )
    parser.add_argument("--epochs",           type=int,   default=8)
    parser.add_argument("--batch_size",       type=int,   default=16)
    parser.add_argument("--lr",               type=float, default=3e-5)
    parser.add_argument("--max_length",       type=int,   default=256)
    parser.add_argument("--seed",             type=int,   default=42)
    parser.add_argument("--warmup_ratio",     type=float, default=0.10)
    parser.add_argument("--label_smoothing",  type=float, default=0.05)
    parser.add_argument("--val_ratio",        type=float, default=0.15)
    parser.add_argument("--patience",         type=int,   default=5)
    parser.add_argument(
        "--device",
        default="cuda" if torch.cuda.is_available() else "cpu",
        help="Device: cuda or cpu",
    )
    parser.add_argument(
        "--eval_only",
        action="store_true",
        help="Run evaluation only (checkpoint must exist)",
    )

    args = parser.parse_args()

    if args.eval_only:
        # Quick eval using the saved checkpoint
        if not CHECKPOINT_DIR.exists():
            print(f"[ERROR] No checkpoint at {CHECKPOINT_DIR}. Run training first.")
            sys.exit(1)
        print("[INFO] Eval-only mode: loading checkpoint and evaluating on full dataset...")
        records = load_all_training_data()
        texts   = [r["text"]     for r in records]
        labels  = [r["sections"] for r in records]
        with open(ENCODER_PATH, "rb") as f:
            mlb = pickle.load(f)
        tokenizer = AutoTokenizer.from_pretrained(str(CHECKPOINT_DIR))
        model     = AutoModelForSequenceClassification.from_pretrained(str(CHECKPOINT_DIR))
        device    = torch.device(args.device)
        model.to(device)
        dataset = BNSDataset(texts, labels, tokenizer, mlb, args.max_length)
        loader  = DataLoader(dataset, batch_size=args.batch_size)
        metrics = evaluate(model, loader, device, threshold=INFERENCE_THRESHOLD)
        print(f"\nEval results ({len(records)} samples):")
        for k, v in metrics.items():
            print(f"  {k:15s}: {v:.4f}")
    else:
        train(
            epochs=args.epochs,
            batch_size=args.batch_size,
            learning_rate=args.lr,
            max_length=args.max_length,
            seed=args.seed,
            warmup_ratio=args.warmup_ratio,
            label_smoothing=args.label_smoothing,
            val_ratio=args.val_ratio,
            patience=args.patience,
            device_str=args.device,
        )
