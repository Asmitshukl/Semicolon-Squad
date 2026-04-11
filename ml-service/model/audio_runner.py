"""
NyayaSetu ML — Unified Audio Processing Pipeline

Processes all audio files from audio_samples/ folder:
- Transcribes using Whisper (ASR)
- Extracts entities (NER)
- Classifies into BNS sections
- Returns complete inference results

Usage:
    python audio_runner.py
"""
from dotenv import load_dotenv
load_dotenv()

import sys
import json
from pathlib import Path

# Fix Windows encoding issues
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Add the nyayasetu_ml module to path
sys.path.insert(0, str(Path(__file__).parent))

from nyayasetu_ml.inference.run import NyayaSetuInference


def print_header(title):
    """Print section header."""
    sep = "=" * 80
    print(f"\n{sep}")
    print(f"  {title}")
    print(f"{sep}\n")


def process_audio(audio_path, audio_num):
    """Process a single audio file through the complete pipeline."""
    
    try:
        print(f"\n{'#' * 80}")
        print(f"# AUDIO {audio_num}: {Path(audio_path).name}")
        print(f"{'#' * 80}\n")
        
        # Initialize engine
        print("[STEP 1] Initializing NyayaSetuInference engine...")
        engine = NyayaSetuInference()
        print("✓ Engine ready\n")
        
        # Process audio (transcribe + classify)
        print("[STEP 2] Transcribing audio using Whisper (ASR)...")
        print(f"[STEP 3] Extracting entities (NER)...")
        print(f"[STEP 4] Classifying into BNS sections (IndicBERT)...")
        print(f"[STEP 5] Retrieving legal properties...")
        result = engine.from_audio(str(audio_path), language="hi")
        print("✓ Processing complete\n")
        
        # Display results
        result.print_summary()
        
        # Store JSON output
        return result
        
    except Exception as e:
        print(f"\n❌ Error processing audio {audio_num}: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    """Process all audio files in audio_samples folder."""
    
    audio_dir = Path(__file__).parent / "audio_samples"
    
    # Find all audio files
    audio_files = []
    for ext in ['*.ogg', '*.wav', '*.mp3', '*.flac', '*.m4a']:
        audio_files.extend(sorted(audio_dir.glob(ext)))
    
    if not audio_files:
        print("❌ No audio files found in audio_samples/ folder")
        print(f"   Check: {audio_dir}")
        return
    
    print_header("NyayaSetu ML — Unified Audio Processing Pipeline")
    print(f"Found {len(audio_files)} audio file(s):\n")
    for i, f in enumerate(audio_files, 1):
        print(f"  {i}. {f.name}")
    
    # Process all audios
    results = []
    for i, audio_file in enumerate(audio_files, 1):
        result = process_audio(str(audio_file), i)
        if result:
            results.append({
                'file': audio_file.name,
                'result': result
            })
    
    # Summary
    print_header(f"Summary: Processed {len(results)}/{len(audio_files)} audios")
    
    for i, data in enumerate(results, 1):
        print(f"\n{i}. {data['file']}")
        print(f"   Primary Section: {data['result'].primary_section}")
        print(f"   Confidence: {data['result'].confidence_scores[data['result'].primary_section]:.3f}")
        print(f"   Cognizable: {'YES ⚠' if data['result'].cognizable else 'NO'}")
        print(f"   Bailable: {'YES' if data['result'].bailable else 'NO ⚠'}")
        print(f"   ASR Confidence: {data['result'].asr_confidence:.0%}")
    
    print(f"\n{'=' * 80}\n")


if __name__ == "__main__":
    main()
