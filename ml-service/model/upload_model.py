from huggingface_hub import HfApi, login
import os

# Load token from environment
token = os.getenv("HF_TOKEN")
if not token:
    raise ValueError("HF_TOKEN not set in environment variables")
login(token=token)

api = HfApi()

# Change "your-username" to your actual HF username
api.create_repo(repo_id="Uday1004/bns-classifier", private=True, exist_ok=True)

# Upload the whole bns_classifier folder
api.upload_folder(
    folder_path="nyayasetu_ml/checkpoints/bns_classifier",
    repo_id="Uday1004/bns-classifier",
    repo_type="model"
)

print("✅ Done! Model is on HuggingFace.")