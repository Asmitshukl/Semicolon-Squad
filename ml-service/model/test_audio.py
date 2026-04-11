#!/usr/bin/env python
"""Process audio files through Whisper + IndicBERT pipeline"""

import os
import json
import glob
from pathlib import Path
from nyayasetu_ml.inference.run import NyayaSetuInference

# Audio folder
AUDIO_FOLDER = Path("audio_samples")
AUDIO_FOLDER.mkdir(exist_ok=True)

# Auto-detect audio files in folder
audio_files = list(AUDIO_FOLDER.glob("*.*"))
print(f"Found {len(audio_files)} audio file(s) in {AUDIO_FOLDER}/\n")

if not audio_files:
    print("⚠️  No audio files found in audio_samples/ folder")
    print("📁 Please add audio files to: audio_samples/")
    print("   Supported formats: .mp3, .wav, .ogg, .flac, .m4a, .mp4")
    exit(0)

print("="*70)
print("  NyayaSetu ML — Audio Test Suite")
print("="*70)

# Initialize engine with Whisper (medium = good for Hindi)
print("\n[INIT] Loading Whisper (medium) + IndicBERT...")
engine = NyayaSetuInference(asr_model_size="medium")
print("[OK] Engine loaded\n")

results = []

for idx, audio_path in enumerate(audio_files, 1):
    
    if not audio_path.exists():
        print(f"⚠️  [{idx}] File not found: {audio_path.name}")
        continue
    
    print("\n" + "="*70)
    print(f"  AUDIO {idx}: {audio_path.name}")
    print("="*70)
    
    try:
        # Process audio with Whisper + IndicBERT
        result = engine.from_audio(str(audio_path), language="hi")
        
        # Extract data
        print("\n[STEP 1] WHISPER TRANSCRIPTION")
        print("-" * 70)
        print(f"📝 Transcribed Text:\n   {result.raw_text}\n")
        print(f"🗣️  ASR Confidence: {result.asr_confidence:.2%}\n")
        
        print("[STEP 2] ENTITY EXTRACTION (NER)")
        print("-" * 70)
        entities = result.entities
        if entities.get("items_stolen"):
            print(f"Items Stolen: {entities['items_stolen']}")
        if entities.get("amount_lost"):
            print(f"Amount Lost: ₹{entities['amount_lost']}")
        if entities.get("evidence"):
            print(f"Evidence: {entities['evidence']}")
        if entities.get("weapon_used"):
            print(f"Weapon Used: {entities['weapon_used']}")
        if entities.get("crime_type_hint"):
            print(f"Crime Type: {entities['crime_type_hint']}")
        print()
        
        print("[STEP 3] INDICBERT CLASSIFICATION")
        print("-" * 70)
        print(f"⚖️  BNS Sections: {result.bns_sections}")
        print(f"🎯 Primary Section: {result.primary_section}\n")
        
        print("📊 Confidence Scores:")
        for section, score in sorted(result.confidence_scores.items(), key=lambda x: x[1], reverse=True)[:5]:
            print(f"   {section}: {score:.2%}")
        print()
        
        print("[STEP 4] LEGAL OUTCOME")
        print("-" * 70)
        print(f"⚠️  Cognizable: {'YES ⚠️' if result.cognizable else 'NO ✓'}")
        print(f"🔒 Bailable: {'YES ✓' if result.bailable else 'NO ⚠️'}\n")
        
        print("✅ Victim Rights:")
        for right in result.victim_rights:
            print(f"   • {right}")
        
        print("\n" + "="*70)
        print(f"  Processing Time: {result.processing_ms}ms")
        print("="*70)
        
        results.append({
            "audio_file": audio_path.name,
            "transcribed_text": result.raw_text,
            "asr_confidence": float(result.asr_confidence),
            "bns_sections": result.bns_sections,
            "primary_section": result.primary_section,
            "confidence_scores": result.confidence_scores,
            "cognizable": result.cognizable,
            "bailable": result.bailable,
            "entities": result.entities,
            "explanation": result.explanation,
            "victim_rights": result.victim_rights,
            "processing_ms": result.processing_ms
        })
        
    except FileNotFoundError:
        print(f"\n❌ Audio file not found: {audio_path.name}")
    except Exception as e:
        print(f"\n❌ Error processing {audio_path.name}:")
        print(f"   {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

# Save detailed JSON output
output_file = "audio_test_results.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"\n✅ Results saved to: {output_file}")
print(f"✅ Processed {len(results)} audio file(s)")
