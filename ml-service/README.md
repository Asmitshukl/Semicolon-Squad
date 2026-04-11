# Victim complaint ML service (Python)

The Node backend forwards requests to this service when `ML_SERVICE_URL` is set (for example `http://127.0.0.1:8080`).

## Endpoints

### `POST /v1/pipeline/json`

JSON body: `{ "raw_text": "...", "rawComplaintText": "...", "language": "hi" }`  
Use this when the complaint is already text (Whisper skipped).

### `POST /v1/pipeline`

Multipart form: field `audio` (file) plus optional `language`, `raw_text`, `rawComplaintText`.  
Node forwards browser recordings here; plug Whisper in before returning `transcript`.

**Response** (JSON, snake_case or camelCase accepted by the Node normalizer):

```json
{
  "transcript": "optional when audio",
  "raw_complaint_text": "normalized complaint narrative",
  "entities": {},
  "classifications": [
    { "section_number": "115", "confidence": 0.91, "title": "..." }
  ],
  "primary_section_number": "115",
  "urgency_level": "HIGH",
  "urgency_reason": "...",
  "severity_score": 0.88,
  "victim_rights": {
    "summary": "...",
    "bullets": ["...", "..."]
  },
  "model_version": "your-model-id"
}
```

### `POST /v1/classify`

JSON body: `{ "raw_text": "...", "language": "hi" }`  
Returns at least `classifications`, `primary_section_number`, `urgency_level`, `urgency_reason`, `severity_score`, `model_version`.

## Run the stub (development)

```bash
cd ml-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

Set in backend `.env`:

```env
ML_SERVICE_URL=http://127.0.0.1:8080
```
