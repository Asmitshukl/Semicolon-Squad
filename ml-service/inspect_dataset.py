import json, sys
path = r'C:\Users\uday raj nkashyap\Semicolon-Squad\ml-service\model\nyayasetu_ml\metadata\hinglish_complaints_cleaned.json'
with open(path, encoding='utf-8', errors='replace') as f:
    data = json.load(f)
print("Type:", type(data))
if isinstance(data, list):
    print("Count:", len(data))
    print("Sample keys:", list(data[0].keys()) if data else "empty")
    print("Sample:", json.dumps(data[0], ensure_ascii=False, indent=2)[:600])
else:
    print("Top keys:", list(data.keys())[:5])
    first_val = list(data.values())[0]
    print("First value type:", type(first_val))
    print("First value:", str(first_val)[:400])
