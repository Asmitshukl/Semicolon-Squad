"""
NyayaSetu — Quick Start Guide
=============================

This script demonstrates the complete workflow:
1. Training a fine-tuned IndicBERT model
2. Evaluating on test examples
3. Using the model for inference
"""

import sys
from pathlib import Path

ROOT = Path(__file__).parent / "example"
sys.path.insert(0, str(ROOT))

print("""
╔════════════════════════════════════════════════════════════════╗
║           NyayaSetu ML — IndicBERT Fine-tuning                ║
╚════════════════════════════════════════════════════════════════╝

Welcome! This guide will help you train and use a fine-tuned
IndicBERT model for BNS section classification.

STEP 1: Environment Setup
─────────────────────────

First, install dependencies:

  pip install torch transformers scikit-learn

For GPU training (recommended):

  pip install torch --index-url https://download.pytorch.org/whl/cu118


STEP 2: Train the Fine-tuned Model
───────────────────────────────────

Run the training script:

  python nyayasetu_ml/training/train_indicbert.py \\
    --epochs 5 \\
    --batch_size 8 \\
    --lr 2e-5

This will:
  ✓ Load 20+ annotated FIR complaints from training_data.py
  ✓ Fine-tune ai4bharat/indic-bert on BNS sections
  ✓ Save model to: checkpoints/bns_classifier/
  ✓ Save label encoder to: checkpoints/label_encoder.pkl

Expected duration:
  - CPU: ~10 minutes
  - GPU: ~3 minutes

Training will show:
  - Loss (binary cross-entropy)
  - F1 score
  - Precision, Recall
  - Exact match accuracy


STEP 3: Test the Model
────────────────────

After training, test with example complaints:

  python test_model.py

This will run 6 example complaints and show:
  ✓ Predicted BNS sections with confidence scores
  ✓ IPC equivalents
  ✓ Cognizable vs Non-cognizable
  ✓ Bailable vs Non-bailable
  ✓ Victim rights in Hinglish
  ✓ Processing time


STEP 4: Use in Your Code
─────────────────────────

from nyayasetu_ml.inference.run import NyayaSetuInference

# Initialize (auto-loads fine-tuned model)
engine = NyayaSetuInference(force_tfidf=False)

# Classify from text
result = engine.from_text("Mere ghar mein chori hui...")

# Output structured result
print(result.to_json())

# Access individual fields
print(f"BNS Sections: {result.bns_sections}")
print(f"Primary: {result.primary_section}")
print(f"Cognizable: {result.cognizable}")
print(f"Confidence: {result.confidence_scores}")


STEP 5: Improve with More Data
───────────────────────────────

Add more annotated examples to:
  nyayasetu_ml/data/training_data.py

Format:
  {
    "text": "Complaint text...",
    "sections": ["BNS 305", "BNS 330"],
    "entities": {...}
  }

Then re-train:
  python nyayasetu_ml/training/train_indicbert.py --epochs 10


TROUBLESHOOTING
───────────────

Q: ModuleNotFoundError: No module named 'torch'
A: pip install torch transformers scikit-learn

Q: IndicBERT checkpoint not found
A: Run training first:
   python nyayasetu_ml/training/train_indicbert.py

Q: Out of Memory during training
A: Reduce batch size:
   python nyayasetu_ml/training/train_indicbert.py --batch_size 4

Q: Low accuracy?
A: Train longer:
   python nyayasetu_ml/training/train_indicbert.py --epochs 20

Q: Want more details?
A: See TRAINING_GUIDE.md


TIPS FOR BEST RESULTS
──────────────────────

1. Dataset Quality
   - Add diverse complaint types
   - Include edge cases
   - Verify BNS section annotations

2. Training
   - Train on GPU for 10+ epochs
   - Monitor validation F1 during training
   - Use default learning rate (2e-5)

3. Inference
   - Adjust threshold for precision vs recall trade-off
   - Extract entities first (NER) for better results
   - Use ensemble if available (v2)

4. Production
   - Quantize model for mobile: bitsandbytes
   - Cache tokenizer for batch inference
   - Monitor prediction confidence over time


ARCHITECTURE OVERVIEW
─────────────────────

Complaint Text (audio or text)
        ↓
   Whisper ASR (for audio)
        ↓
  IndicBERT Tokenizer
        ↓
  IndicBERT Encoder (768-dim)
        ↓
  Query Fine-tuned Classifier
        ↓
 BNS Section Scores [0, 1]
        ↓
  Apply Threshold (0.5)
        ↓
  Structured Output JSON
        ↓
   Downstream Systems
   (Police Dashboard, FIR Draft, Legal Advisor)


NEXT STEPS
──────────

1. Train model: python nyayasetu_ml/training/train_indicbert.py
2. Test model:  python test_model.py
3. Integrate:   from inference.run import *
4. Improve:     Add more training data & re-train
5. Deploy:      Package model + API

For full documentation, see: TRAINING_GUIDE.md
""")


def ask_continue():
    """Ask if user wants to start training."""
    response = input("Ready to train? (y/n): ").strip().lower()
    if response == "y":
        print("\nStarting training...\n")
        import subprocess

        result = subprocess.run(
            [
                sys.executable,
                "nyayasetu_ml/training/train_indicbert.py",
                "--epochs",
                "5",
                "--batch_size",
                "8",
            ],
            cwd=str(ROOT),
        )
        return result.returncode == 0
    return False


if __name__ == "__main__":
    try:
        if ask_continue():
            print("\n✓ Training complete!")
            print("Next: python test_model.py")
    except KeyboardInterrupt:
        print("\n\nCancelled.")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        print("\nFor help, see: TRAINING_GUIDE.md")
