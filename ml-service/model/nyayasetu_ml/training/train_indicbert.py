"""
NyayaSetu — IndicBERT Fine-tuning Script
=========================================

Fine-tunes IndicBERT on BNS section multi-label classification task.

Architecture:
  - Model: ai4bharat/indic-bert (pretrained on 11 Indian languages)
  - Task: Multi-label BNS section classification
  - Loss: Binary Cross-Entropy with Logits (BCEWithLogitsLoss)
  - Input: 256 tokens max
  - Output: Probability per BNS section (sigmoid)

Usage:
  # Basic training
  python training/train_indicbert.py --epochs 5 --batch_size 8

  # With data augmentation
  python training/train_indicbert.py --epochs 10 --batch_size 16 --augment

  # Evaluate only
  python training/train_indicbert.py --eval_only

Requirements:
  pip install torch transformers scikit-learn
"""

import sys
import json
import pickle
import argparse
from pathlib import Path
from typing import List, Dict, Tuple

import numpy as np

# Add parent to path
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from data.training_data import TRAINING_DATA
from data.bns_sections import BNS_SECTIONS

# Import ML libraries
try:
    import torch
    import torch.nn.functional as F
    from torch.utils.data import Dataset, DataLoader
    from torch.optim import AdamW
    from transformers import (
        AutoTokenizer,
        AutoModelForSequenceClassification,
        get_linear_schedule_with_warmup,
    )
    from sklearn.preprocessing import MultiLabelBinarizer
    ML_AVAILABLE = True
except ImportError as e:
    ML_AVAILABLE = False
    print(f"[ERROR] Missing dependencies: {e}")
    print("Install with: pip install torch transformers scikit-learn")
    sys.exit(1)


# ══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════════

CHECKPOINT_DIR = ROOT / "checkpoints" / "bns_classifier"
ENCODER_PATH = ROOT / "checkpoints" / "label_encoder.pkl"
CONFIG_PATH = ROOT / "checkpoints" / "bns_config.json"

MODEL_NAME = "ai4bharat/indic-bert"
INFERENCE_THRESHOLD = 0.5


# ══════════════════════════════════════════════════════════════════════════════
# DATASET
# ══════════════════════════════════════════════════════════════════════════════

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
        self.texts = texts
        self.label_names = labels
        self.tokenizer = tokenizer
        self.mlb = mlb
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]
        label_names = self.label_names[idx]

        # Tokenize
        encoding = self.tokenizer(
            text,
            max_length=self.max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )

        # Convert label names to binary vector
        label_vector = self.mlb.transform([label_names])[0]

        return {
            "input_ids": encoding["input_ids"].squeeze(),
            "attention_mask": encoding["attention_mask"].squeeze(),
            "labels": torch.tensor(label_vector, dtype=torch.float32),
        }


# ══════════════════════════════════════════════════════════════════════════════
# TRAINING
# ══════════════════════════════════════════════════════════════════════════════

def train_epoch(model, dataloader, optimizer, scheduler, device):
    """Train one epoch."""
    model.train()
    total_loss = 0.0
    batch_count = 0

    for batch in dataloader:
        input_ids = batch["input_ids"].to(device)
        attention_mask = batch["attention_mask"].to(device)
        labels = batch["labels"].to(device)

        optimizer.zero_grad()

        # Forward pass
        outputs = model(
            input_ids=input_ids,
            attention_mask=attention_mask,
        )
        logits = outputs.logits

        # Multi-label loss (BCEWithLogitsLoss)
        loss = F.binary_cross_entropy_with_logits(logits, labels)

        # Backward
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        scheduler.step()

        total_loss += loss.item()
        batch_count += 1

    return total_loss / batch_count if batch_count > 0 else 0.0


def evaluate(model, dataloader, device, threshold: float = 0.5):
    """Evaluate model on validation set."""
    model.eval()
    total_loss = 0.0
    all_preds = []
    all_labels = []
    batch_count = 0

    with torch.no_grad():
        for batch in dataloader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
            )
            logits = outputs.logits

            loss = F.binary_cross_entropy_with_logits(logits, labels)
            total_loss += loss.item()
            batch_count += 1

            # Get predictions
            probs = torch.sigmoid(logits)
            preds = (probs >= threshold).cpu().numpy()
            all_preds.extend(preds)
            all_labels.extend(labels.cpu().numpy())

    avg_loss = total_loss / batch_count if batch_count > 0 else 0.0

    # Compute metrics
    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)

    # Hamming loss (per-label accuracy)
    hamming_loss = np.mean(all_preds != all_labels)

    # Exact match (all labels correct)
    exact_match = np.mean(np.all(all_preds == all_labels, axis=1))

    # Micro F1
    tp = np.sum(all_preds * all_labels)
    fp = np.sum(all_preds * (1 - all_labels))
    fn = np.sum((1 - all_preds) * all_labels)
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0

    return {
        "loss": avg_loss,
        "hamming_loss": hamming_loss,
        "exact_match": exact_match,
        "precision": precision,
        "recall": recall,
        "f1": f1,
    }


def train(
    epochs: int = 5,
    batch_size: int = 8,
    learning_rate: float = 2e-5,
    max_length: int = 256,
    seed: int = 42,
    device: str = "cuda" if torch.cuda.is_available() else "cpu",
):
    """Main training loop."""

    print(f"\n{'='*70}")
    print(f"  NyayaSetu — IndicBERT Fine-tuning")
    print(f"{'='*70}")
    print(f"  Model: {MODEL_NAME}")
    print(f"  Epochs: {epochs}")
    print(f"  Batch size: {batch_size}")
    print(f"  Learning rate: {learning_rate}")
    print(f"  Max length: {max_length}")
    print(f"  Device: {device}")
    print(f"{'='*70}\n")

    # Set seed
    torch.manual_seed(seed)
    np.random.seed(seed)

    device = torch.device(device)

    # ── Data preparation ─────────────────────────────────────────────────────
    print("[1/5] Loading training data...")
    texts = [item["text"] for item in TRAINING_DATA]
    labels = [item["sections"] for item in TRAINING_DATA]

    # All unique BNS sections
    all_sections = sorted(set(sec for label_list in labels for sec in label_list))
    print(f"  Total samples: {len(texts)}")
    print(f"  Unique BNS sections: {len(all_sections)}")
    print(f"  Sections: {all_sections}\n")

    # Multi-label binarizer
    mlb = MultiLabelBinarizer(classes=all_sections)
    mlb.fit([all_sections])

    # ── Model & Tokenizer ────────────────────────────────────────────────────
    print(f"[2/5] Loading model and tokenizer...")
    try:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        print(f"  ✓ Tokenizer loaded")
    except Exception as e:
        print(f"  ⚠ Failed to load tokenizer: {e}")
        print(f"  Falling back to bert-base-multilingual-cased")
        tokenizer = AutoTokenizer.from_pretrained("bert-base-multilingual-cased")

    try:
        model = AutoModelForSequenceClassification.from_pretrained(
            MODEL_NAME,
            num_labels=len(all_sections),
            problem_type="multi_label_classification",
        )
        print(f"  ✓ Model loaded")
    except Exception as e:
        print(f"  ⚠ Failed to load model: {e}")
        print(f"  Falling back to bert-base-multilingual-cased")
        model = AutoModelForSequenceClassification.from_pretrained(
            "bert-base-multilingual-cased",
            num_labels=len(all_sections),
            problem_type="multi_label_classification",
        )

    model.to(device)
    param_count = sum(p.numel() for p in model.parameters())
    print(f"  Parameters: {param_count:,}\n")

    # ── Dataset & DataLoader ─────────────────────────────────────────────────
    print(f"[3/5] Creating datasets...")
    dataset = BNSDataset(
        texts=texts,
        labels=labels,
        tokenizer=tokenizer,
        mlb=mlb,
        max_length=max_length,
    )

    # Simple 80/20 split
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(
        dataset, [train_size, val_size]
    )

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    print(f"  Training: {len(train_dataset)} samples")
    print(f"  Validation: {len(val_dataset)} samples\n")

    # ── Optimizer & Scheduler ────────────────────────────────────────────────
    print(f"[4/5] Setting up optimizer...")
    optimizer = AdamW(model.parameters(), lr=learning_rate)
    total_steps = len(train_loader) * epochs
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=0,
        num_training_steps=total_steps,
    )
    print(f"  Total steps: {total_steps}\n")

    # ── Training ─────────────────────────────────────────────────────────────
    print(f"[5/5] Training...\n")
    best_val_f1 = 0.0
    patience_counter = 0
    patience_limit = 3

    for epoch in range(epochs):
        # Train
        train_loss = train_epoch(model, train_loader, optimizer, scheduler, device)

        # Validate
        val_metrics = evaluate(model, val_loader, device, threshold=INFERENCE_THRESHOLD)

        print(f"Epoch {epoch+1}/{epochs}")
        print(f"  Train loss: {train_loss:.4f}")
        print(f"  Val loss:   {val_metrics['loss']:.4f}")
        print(f"  Precision:  {val_metrics['precision']:.4f}")
        print(f"  Recall:     {val_metrics['recall']:.4f}")
        print(f"  F1:         {val_metrics['f1']:.4f}")
        print(f"  Exact match: {val_metrics['exact_match']:.2%}")

        # Early stopping
        if val_metrics['f1'] > best_val_f1:
            best_val_f1 = val_metrics['f1']
            patience_counter = 0
            print("  ✓ Saving checkpoint...\n")

            # Create checkpoint directory
            CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)

            # Save model & tokenizer
            model.save_pretrained(str(CHECKPOINT_DIR))
            tokenizer.save_pretrained(str(CHECKPOINT_DIR))

            # Save label encoder
            with open(ENCODER_PATH, "wb") as f:
                pickle.dump(mlb, f)

            # Save config
            config = {
                "model_name": MODEL_NAME,
                "num_labels": len(all_sections),
                "label_classes": all_sections,
                "threshold": INFERENCE_THRESHOLD,
                "max_length": max_length,
            }
            with open(CONFIG_PATH, "w") as f:
                json.dump(config, f, indent=2)

        else:
            patience_counter += 1
            print()
            if patience_counter >= patience_limit:
                print(f"  ⚠ Early stopping (patience {patience_limit} reached)\n")
                break

    print(f"{'='*70}")
    print(f"  ✓ Training complete!")
    print(f"  Best validation F1: {best_val_f1:.4f}")
    print(f"  Checkpoint saved to: {CHECKPOINT_DIR}")
    print(f"{'='*70}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Fine-tune IndicBERT on BNS section classification"
    )
    parser.add_argument("--epochs", type=int, default=5, help="Number of epochs")
    parser.add_argument("--batch_size", type=int, default=8, help="Batch size")
    parser.add_argument("--lr", type=float, default=2e-5, help="Learning rate")
    parser.add_argument("--max_length", type=int, default=256, help="Max token length")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument(
        "--device",
        default="cuda" if torch.cuda.is_available() else "cpu",
        help="Device (cuda/cpu)",
    )
    parser.add_argument("--eval_only", action="store_true", help="Evaluate only")

    args = parser.parse_args()

    if args.eval_only:
        print("[INFO] Evaluation mode not implemented yet")
    else:
        train(
            epochs=args.epochs,
            batch_size=args.batch_size,
            learning_rate=args.lr,
            max_length=args.max_length,
            seed=args.seed,
            device=args.device,
        )
