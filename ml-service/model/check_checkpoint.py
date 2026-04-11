from pathlib import Path
import sys

# Test 1: Direct path check
print("="*60)
print("TEST 1: Direct Path Check")
print("="*60)

classifier_file = Path("nyayasetu_ml/evidence_classifier/classifier.py")
checkpoint_dir = classifier_file.parent.parent / "checkpoints" / "bns_classifier"
encoder_path = classifier_file.parent.parent / "checkpoints" / "label_encoder.pkl"
config_path = classifier_file.parent.parent / "checkpoints" / "bns_config.json"

print(f"Checkpoint dir: {checkpoint_dir.resolve()}")
print(f"  Exists: {checkpoint_dir.exists()}")

print(f"\nEncoder path: {encoder_path.resolve()}")
print(f"  Exists: {encoder_path.exists()}")

print(f"\nConfig path: {config_path.resolve()}")
print(f"  Exists: {config_path.exists()}")

if checkpoint_dir.exists():
    print(f"\nContents of {checkpoint_dir}:")
    for item in checkpoint_dir.iterdir():
        print(f"  - {item.name}")

# Test 2: Import and check
print("\n" + "="*60)
print("TEST 2: Import Check")
print("="*60)

sys.path.insert(0, str(Path.cwd()))
from nyayasetu_ml.evidence_classifier.classifier import IndicBERTPredictor

pred = IndicBERTPredictor()
print(f"IndicBERTPredictor Checkpoint DIR: {pred.CHECKPOINT_DIR}")
print(f"  Exists: {pred.CHECKPOINT_DIR.exists()}")
print(f"\nEncoder PATH: {pred.ENCODER_PATH}")
print(f"  Exists: {pred.ENCODER_PATH.exists()}")
print(f"\nConfig PATH: {pred.CONFIG_PATH}")
print(f"  Exists: {pred.CONFIG_PATH.exists()}")
print(f"\nis_available(): {pred.is_available()}")

