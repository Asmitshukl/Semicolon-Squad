"""
push_to_hf.py — Upload trained BNS classifier checkpoint to HuggingFace Hub

Usage:
    python push_to_hf.py --repo YOUR_HF_USERNAME/nyayasetu-bns-classifier
    python push_to_hf.py --repo YOUR_HF_USERNAME/nyayasetu-bns-classifier --private

The script will prompt for your HF token securely (not echoed to terminal).
You can also set the HF_TOKEN environment variable instead of typing it.
"""

import argparse
import getpass
import os
import sys
from pathlib import Path

CHECKPOINT_DIR = (
    Path(__file__).resolve().parent
    / "nyayasetu_ml"
    / "checkpoints"
    / "bns_classifier"
)
CONFIG_PATH    = CHECKPOINT_DIR.parent.parent / "checkpoints" / "bns_config.json"
ENCODER_PATH   = CHECKPOINT_DIR.parent.parent / "checkpoints" / "label_encoder.pkl"

EXTRA_FILES = [
    CHECKPOINT_DIR.parent.parent / "checkpoints" / "label_encoder.pkl",
    CHECKPOINT_DIR.parent.parent / "checkpoints" / "bns_config.json",
]


def main():
    parser = argparse.ArgumentParser(description="Push BNS classifier to HuggingFace Hub")
    parser.add_argument(
        "--repo",
        required=True,
        help="HuggingFace repo id, e.g. your-username/nyayasetu-bns-classifier",
    )
    parser.add_argument(
        "--private",
        action="store_true",
        default=False,
        help="Create the repo as private (default: public)",
    )
    args = parser.parse_args()

    # ── Verify checkpoint exists ──────────────────────────────────────────────
    if not CHECKPOINT_DIR.exists():
        print(f"[ERROR] Checkpoint directory not found: {CHECKPOINT_DIR}")
        print("  Run training first:  python -m nyayasetu_ml.training.train_indicbert")
        sys.exit(1)

    model_file = CHECKPOINT_DIR / "model.safetensors"
    if not model_file.exists():
        # pytorch_model.bin fallback
        model_file = CHECKPOINT_DIR / "pytorch_model.bin"
    if not model_file.exists():
        print("[ERROR] No model weights file found in checkpoint directory.")
        sys.exit(1)

    print(f"\nCheckpoint found: {CHECKPOINT_DIR}")
    print(f"Model weights  : {model_file.name}  ({model_file.stat().st_size / 1e6:.1f} MB)")

    # ── Get token ─────────────────────────────────────────────────────────────
    token = os.environ.get("HF_TOKEN", "").strip()
    if not token:
        print("\nEnter your HuggingFace access token (Write permission required).")
        print("Get it from: https://huggingface.co/settings/tokens")
        token = getpass.getpass("HF Token (hidden): ").strip()

    if not token:
        print("[ERROR] No token provided.")
        sys.exit(1)

    # ── Import HF Hub ─────────────────────────────────────────────────────────
    try:
        from huggingface_hub import HfApi, create_repo
    except ImportError:
        print("[ERROR] huggingface_hub not installed.")
        print("  Run:  pip install huggingface_hub")
        sys.exit(1)

    api = HfApi(token=token)

    # ── Create repo if it doesn't exist ──────────────────────────────────────
    print(f"\nTarget repo    : https://huggingface.co/{args.repo}")
    print(f"Visibility     : {'private' if args.private else 'public'}")

    try:
        create_repo(
            repo_id=args.repo,
            token=token,
            private=args.private,
            exist_ok=True,
        )
        print(f"[OK] Repo ready: {args.repo}")
    except Exception as e:
        print(f"[ERROR] Could not create repo: {e}")
        sys.exit(1)

    # ── Upload checkpoint folder ──────────────────────────────────────────────
    print("\nUploading checkpoint files...")
    try:
        api.upload_folder(
            folder_path=str(CHECKPOINT_DIR),
            repo_id=args.repo,
            repo_type="model",
            token=token,
            commit_message="Add NyayaSetu BNS classifier checkpoint (DistilBERT multilingual)",
        )
        print(f"\n[OK] Model weights uploaded!")
    except Exception as e:
        print(f"[ERROR] Upload failed: {e}")
        sys.exit(1)

    # ── Upload extra config files ─────────────────────────────────────────────
    for extra in EXTRA_FILES:
        if extra.exists() and extra.parent != CHECKPOINT_DIR:
            try:
                api.upload_file(
                    path_or_fileobj=str(extra),
                    path_in_repo=extra.name,
                    repo_id=args.repo,
                    repo_type="model",
                    token=token,
                    commit_message=f"Add {extra.name}",
                )
                print(f"[OK] Uploaded {extra.name}")
            except Exception as e:
                print(f"[WARN] Could not upload {extra.name}: {e}")

    # ── Write a minimal README ────────────────────────────────────────────────
    readme = f"""---
language:
- hi
- en
tags:
- text-classification
- multi-label-classification
- legal
- bns
- ipc
- india
- hindi
- hinglish
base_model: distilbert-base-multilingual-cased
---

# NyayaSetu — BNS Section Classifier

Multi-label classifier that maps Indian FIR complaint text (Hindi / English / Hinglish)
to applicable **Bharatiya Nyaya Sanhita (BNS) 2023** sections.

## Base model
`distilbert-base-multilingual-cased` fine-tuned on 2,210 annotated FIR complaints.

## Labels
52 BNS sections covering theft, robbery, assault, fraud, kidnapping, and more.

## Inference threshold
`0.4` (sections with sigmoid probability >= 0.4 are returned)

## Usage
```python
from transformers import pipeline
classifier = pipeline("text-classification", model="{args.repo}", top_k=None)
result = classifier("Mere ghar mein chor ghus aaya aur laptop le gaya.")
```
"""

    try:
        api.upload_file(
            path_or_fileobj=readme.encode("utf-8"),
            path_in_repo="README.md",
            repo_id=args.repo,
            repo_type="model",
            token=token,
            commit_message="Add model card README",
        )
        print("[OK] README.md uploaded")
    except Exception as e:
        print(f"[WARN] README upload failed: {e}")

    print(f"\n{'='*60}")
    print(f"  Model live at: https://huggingface.co/{args.repo}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
