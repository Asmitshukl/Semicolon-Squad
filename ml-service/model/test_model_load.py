import sys
from pathlib import Path

sys.path.insert(0, str(Path.cwd()))

print("="*60)
print("Loading Model + PyTorch")
print("="*60)

try:
    import torch
    print(f"✓ PyTorch available: {torch.__version__}")
except ImportError as e:
    print(f"✗ PyTorch missing: {e}")
    sys.exit(1)

try:
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    print("✓ Transformers available")
except ImportError as e:
    print(f"✗ Transformers missing: {e}")
    sys.exit(1)

checkpoint_dir = Path("nyayasetu_ml/checkpoints/bns_classifier")

try:
    print(f"\nLoading tokenizer from {checkpoint_dir}...")
    tokenizer = AutoTokenizer.from_pretrained(str(checkpoint_dir))
    print(f"✓ Tokenizer loaded")
except Exception as e:
    print(f"✗ Tokenizer error: {e}")
    sys.exit(1)

try:
    print(f"\nLoading model from {checkpoint_dir}...")
    model = AutoModelForSequenceClassification.from_pretrained(str(checkpoint_dir))
    print(f"✓ Model loaded")
    print(f"  Model class: {model.__class__.__name__}")
    print(f"  Num parameters: {sum(p.numel() for p in model.parameters()):,}")
except Exception as e:
    print(f"✗ Model error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "="*60)
print("SUCCESS - Model is loadable!")
print("="*60)
