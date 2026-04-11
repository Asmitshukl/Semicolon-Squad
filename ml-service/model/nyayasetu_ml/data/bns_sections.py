"""
BNS (Bharatiya Nyaya Sanhita) 2023 — Section definitions,
IPC→BNS mapping, cognizability and bailability metadata.
"""

# -----------------------------------------------------------
# BNS Section Metadata
# -----------------------------------------------------------
BNS_SECTIONS = {
    "BNS 101": {
        "title": "Murder",
        "description": "Whoever causes death with intention or knowledge",
        "cognizable": True,
        "bailable": False,
        "ipc_equiv": "IPC 302",
        "keywords": ["murder", "kill", "death", "hatyaa", "maut", "jaan lena"],
    },
    "BNS 115": {
        "title": "Voluntarily causing grievous hurt",
        "description": "Causing grievous hurt voluntarily",
        "cognizable": True,
        "bailable": False,
        "ipc_equiv": "IPC 325",
        "keywords": ["grievous", "serious injury", "ghayal", "chot", "toot gaya", "fracture"],
    },
    "BNS 118": {
        "title": "Voluntarily causing hurt",
        "description": "Causing hurt voluntarily",
        "cognizable": True,
        "bailable": True,
        "ipc_equiv": "IPC 323",
        "keywords": ["hurt", "beat", "assault", "maara", "peet", "dhakka", "thappad"],
    },
    "BNS 191": {
        "title": "Dacoity",
        "description": "Five or more persons conjointly committing robbery",
        "cognizable": True,
        "bailable": False,
        "ipc_equiv": "IPC 395",
        "keywords": ["dacoity", "gang robbery", "dakait", "5 log", "panel", "gang"],
    },
    "BNS 194": {
        "title": "Robbery",
        "description": "Theft with force or threat of force",
        "cognizable": True,
        "bailable": False,
        "ipc_equiv": "IPC 392",
        "keywords": ["robbery", "loot", "lootna", "force", "threat", "gun", "knife", "weapon"],
    },
    "BNS 303": {
        "title": "Theft",
        "description": "Dishonest taking of moveable property without consent",
        "cognizable": True,
        "bailable": True,
        "ipc_equiv": "IPC 379",
        "keywords": ["theft", "steal", "chori", "churaya", "le gaya", "missing", "gum"],
    },
    "BNS 305": {
        "title": "Theft in dwelling house",
        "description": "Theft committed in a dwelling house or vessel",
        "cognizable": True,
        "bailable": False,
        "ipc_equiv": "IPC 380",
        "keywords": [
            "ghar mein chori", "house theft", "ghar", "dwelling", "laptop", "cash",
            "jewellery", "gold", "kangan", "ghar se churaya", "andar aaya",
        ],
    },
    "BNS 309": {
        "title": "Extortion",
        "description": "Intentionally putting person in fear to deliver property",
        "cognizable": True,
        "bailable": False,
        "ipc_equiv": "IPC 384",
        "keywords": ["extortion", "blackmail", "dhamki", "daraya", "paisa de", "warna"],
    },
    "BNS 316": {
        "title": "Criminal breach of trust",
        "description": "Dishonest misappropriation of entrusted property",
        "cognizable": True,
        "bailable": False,
        "ipc_equiv": "IPC 406",
        "keywords": ["breach of trust", "cheated", "dhokha", "paisa nahi diya", "rakh ke bhag gaya"],
    },
    "BNS 318": {
        "title": "Cheating",
        "description": "Deceiving a person and dishonestly inducing delivery of property",
        "cognizable": False,
        "bailable": True,
        "ipc_equiv": "IPC 420",
        "keywords": [
            "fraud", "cheating", "thagi", "online fraud", "UPI fraud", "OTP",
            "fake", "jhooth", "dhoka", "paise le gaya", "investment", "scheme",
        ],
    },
    "BNS 319": {
        "title": "Cheating by personation",
        "description": "Cheating by pretending to be some other person",
        "cognizable": False,
        "bailable": True,
        "ipc_equiv": "IPC 416",
        "keywords": ["impersonation", "fake identity", "identity theft", "naqli"],
    },
    "BNS 326": {
        "title": "Forgery",
        "description": "Making false documents with intent to cause damage",
        "cognizable": False,
        "bailable": True,
        "ipc_equiv": "IPC 463",
        "keywords": ["forgery", "fake document", "jaali", "naqli document", "signature"],
    },
    "BNS 329": {
        "title": "House trespass",
        "description": "Entering into or upon property in possession of another",
        "cognizable": False,
        "bailable": True,
        "ipc_equiv": "IPC 448",
        "keywords": [
            "trespass", "andar ghusa", "darwaza toda", "ghar mein ghusa",
            "forcibly entered", "bina permission", "tod ke",
        ],
    },
    "BNS 330": {
        "title": "House breaking",
        "description": "Housebreaking means trespass by one of six modes (force, scaling, etc.)",
        "cognizable": True,
        "bailable": False,
        "ipc_equiv": "IPC 454",
        "keywords": [
            "housebreaking", "darwaza tod", "lock toda", "khidki", "break in",
            "zor se khola", "toota", "window", "roof", "chhath se utra",
        ],
    },
    "BNS 351": {
        "title": "Criminal intimidation",
        "description": "Threatening injury to person, reputation, or property",
        "cognizable": False,
        "bailable": True,
        "ipc_equiv": "IPC 503",
        "keywords": ["threat", "dhamki", "maar dunga", "jaan se marunga", "dar", "intimidate"],
    },
    "BNS 352": {
        "title": "Intentional insult",
        "description": "Intentional insult with intent to provoke breach of peace",
        "cognizable": False,
        "bailable": True,
        "ipc_equiv": "IPC 504",
        "keywords": ["insult", "gaali", "abusive", "bura bola", "izzat", "maa ki gaali"],
    },
    "BNS 74": {
        "title": "Assault or use of criminal force to woman with intent to outrage modesty",
        "description": "Outraging modesty of a woman",
        "cognizable": True,
        "bailable": False,
        "ipc_equiv": "IPC 354",
        "keywords": [
            "molest", "outrage modesty", "touched inappropriately", "chedkhani",
            "chhedna", "aurat", "mahila", "ladki", "haath lagaya",
        ],
    },
    "BNS 64": {
        "title": "Rape",
        "description": "Sexual assault as defined under BNS",
        "cognizable": True,
        "bailable": False,
        "ipc_equiv": "IPC 376",
        "keywords": ["rape", "sexual assault", "balatkar", "jabardasti"],
    },
    "BNS 132": {
        "title": "Culpable homicide not amounting to murder",
        "description": "Act causing death without full murder intent",
        "cognizable": True,
        "bailable": False,
        "ipc_equiv": "IPC 304",
        "keywords": ["accidental death", "negligence death", "gaadi se mara", "accident mein maut"],
    },
    "BNS 281": {
        "title": "Kidnapping",
        "description": "Taking or enticing a minor or person of unsound mind",
        "cognizable": True,
        "bailable": False,
        "ipc_equiv": "IPC 363",
        "keywords": ["kidnap", "abduct", "apaharan", "uthaya", "le gaye", "bacha", "child missing"],
    },
}

# -----------------------------------------------------------
# IPC to BNS quick lookup
# -----------------------------------------------------------
IPC_TO_BNS = {v["ipc_equiv"]: k for k, v in BNS_SECTIONS.items()}

# -----------------------------------------------------------
# Crime type → likely sections mapping (rule-based fallback)
# -----------------------------------------------------------
CRIME_CATEGORY_RULES = {
    "house_theft":      ["BNS 305", "BNS 330"],
    "robbery":          ["BNS 194"],
    "dacoity":          ["BNS 191"],
    "plain_theft":      ["BNS 303"],
    "online_fraud":     ["BNS 318"],
    "cheating":         ["BNS 318"],
    "murder":           ["BNS 101"],
    "grievous_hurt":    ["BNS 115"],
    "hurt":             ["BNS 118"],
    "trespass":         ["BNS 329"],
    "housebreaking":    ["BNS 330"],
    "threat":           ["BNS 351"],
    "kidnap":           ["BNS 281"],
    "molestation":      ["BNS 74"],
    "rape":             ["BNS 64"],
    "extortion":        ["BNS 309"],
    "breach_of_trust":  ["BNS 316"],
}