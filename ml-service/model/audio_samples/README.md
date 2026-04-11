# 🎙️ Audio Samples Folder

Save your FIR complaint audio files here.

## 📝 Supported Formats

- `.mp3` — MP3 audio
- `.wav` — WAV audio (recommended for best quality)
- `.ogg` — OGG Vorbis
- `.flac` — FLAC (lossless)
- `.m4a` — AAC audio
- `.mp4` — Video with audio track

## 🗣️ Supported Languages

- Hindi (`hi`)
- English (`en`)
- Auto-detect (if not specified)

## 🚀 How to Use

1. **Add audio files** to this folder (`audio_samples/`)
2. **Run the test**:
   ```bash
   python test_audio.py
   ```
3. **View results**:
   - Console output shows real-time processing
   - `audio_test_results.json` contains detailed results

## 📊 Processing Pipeline

For each audio file:

1. 🎙️ **Whisper ASR** — Convert audio → text
2. 📝 **NER** — Extract entities (items, amounts, evidence, etc.)
3. ⚖️ **IndicBERT** — Classify → BNS sections
4. ✅ **Rights** — Generate victim rights

## 📋 Output Example

```
AUDIO 1: complaint_1.wav
========================================
[STEP 1] WHISPER TRANSCRIPTION
📝 Transcribed Text: "Mere ghar mein kal raat chori hui..."
🗣️ ASR Confidence: 94.32%

[STEP 2] ENTITY EXTRACTION
Items Stolen: ['laptop', 'cash']
Amount Lost: ₹15,000
Evidence: ['CCTV', 'witness']

[STEP 3] INDICBERT CLASSIFICATION
⚖️ BNS Sections: ['BNS 330', 'BNS 326']
📊 Confidence: BNS 330: 82%, BNS 326: 71%

[STEP 4] LEGAL OUTCOME
Cognizable: YES ⚠️
Bailable: NO ⚠️
✅ Victim Rights: [list of rights]
```

---

**Ready to test!** Add your audio files and run: `python test_audio.py`
