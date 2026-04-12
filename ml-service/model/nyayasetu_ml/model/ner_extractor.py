"""
NyayaSetu — Named Entity Recognition (NER) Module
Extracts structured incident entities from raw complaint text.

In production: fine-tune distilbert-base-multilingual-cased on an FIR NER corpus.
Here: rule-based extraction (same interface, drop-in replaceable).
"""

import re
from dataclasses import dataclass, field
from typing import List, Optional


# ── Entity container ─────────────────────────────────────────────────────────

@dataclass
class IncidentEntities:
    victim_name: Optional[str] = None
    accused_description: Optional[str] = None
    location: Optional[str] = None
    time_of_incident: Optional[str] = None
    items_stolen: List[str] = field(default_factory=list)
    amount_lost: Optional[float] = None
    weapon_used: Optional[str] = None
    injury_description: Optional[str] = None
    evidence: List[str] = field(default_factory=list)
    entry_mode: Optional[str] = None
    vehicle: Optional[str] = None
    accused_count: Optional[int] = None
    victim_gender: Optional[str] = None
    crime_type_hint: Optional[str] = None

    def to_dict(self):
        return {k: v for k, v in self.__dict__.items() if v is not None and v != []}


# ── Pattern dictionaries ─────────────────────────────────────────────────────

ITEM_PATTERNS = [
    r"laptop", r"mobile[\s\w]*", r"phone[\s\w]*", r"camera", r"TV", r"television",
    r"refrigerator", r"fridge", r"purse", r"wallet", r"bataua",
    r"cash[\s\w]*", r"paisa[\s\w]*", r"\d+[\s]*hazaar[\s]*(?:rupay[ae]?|cash)?",
    r"[\d,]+[\s]*rupay[ae]?", r"rs\.?\s*[\d,]+",
    r"gold[\s\w]*", r"sone ki chain", r"kangan", r"zevar[\s\w]*", r"jewellery",
    r"chain[\s\w]*", r"ring", r"bangle", r"necklace",
    r"cheque[\s\w]*", r"document[\s\w]*", r"property[\s\w]*",
    r"aabhushan", r"gehna[\s\w]*",
]

WEAPON_PATTERNS = {
    "knife":    [r"chaku", r"knife", r"blade", r"chhuri"],
    "gun":      [r"\bgun\b", r"pistol", r"revolver", r"goli", r"bandook"],
    "rod":      [r"\brod\b", r"lathi", r"danda", r"iron pipe"],
    "acid":     [r"acid", r"tezaab"],
    "blunt":    [r"pathar", r"stone", r"brick", r"eent"],
}

ENTRY_MODE_PATTERNS = {
    "door broken":   [r"darwaza tod", r"door broke", r"lock tod", r"taala tod"],
    "window broken": [r"khidki.*tod", r"window.*break", r"shisha tod", r"glass tod"],
    "scaled wall":   [r"deewar phaand", r"wall climb", r"chhath se"],
    "forced entry":  [r"zor se", r"forcibly", r"force karke"],
    "unlocked":      [r"khula tha", r"door was open"],
}

EVIDENCE_PATTERNS = {
    "CCTV":     [r"cctv", r"camera footage", r"camera mein"],
    "witness":  [r"witness", r"gawah", r"dekha", r"pehchan"],
    "WhatsApp": [r"whatsapp", r"message", r"screenshot"],
    "call log": [r"call record", r"phone log", r"missed call"],
    "bank statement": [r"bank statement", r"transaction", r"passbook"],
}

TIME_PATTERNS = [
    r"kal raat",  r"aaj subah", r"parson",  r"pichhli raat",
    r"last night", r"yesterday", r"this morning", r"today",
    r"\d{1,2}\s*(?:baje|am|pm|AM|PM)",
    r"\d{1,2}[:\-]\d{2}\s*(?:am|pm|AM|PM)?",
]


# ── Extractor class ──────────────────────────────────────────────────────────

class NERExtractor:
    """
    Rule-based NER extractor for Hindi/English FIR complaints.

    Production upgrade path:
      1. Replace with fine-tuned distilbert-base-multilingual-cased NER model loaded via:
         from transformers import pipeline
         self.nlp = pipeline('ner', model='distilbert-base-multilingual-cased', ...)
      2. Keep the same extract() interface — rest of pipeline unchanged.
    """

    def __init__(self):
        self._compile_patterns()

    def _compile_patterns(self):
        self._item_re = [re.compile(p, re.IGNORECASE) for p in ITEM_PATTERNS]
        self._weapon_re = {
            w: [re.compile(p, re.IGNORECASE) for p in pats]
            for w, pats in WEAPON_PATTERNS.items()
        }
        self._entry_re = {
            mode: [re.compile(p, re.IGNORECASE) for p in pats]
            for mode, pats in ENTRY_MODE_PATTERNS.items()
        }
        self._evidence_re = {
            ev: [re.compile(p, re.IGNORECASE) for p in pats]
            for ev, pats in EVIDENCE_PATTERNS.items()
        }
        self._time_re = [re.compile(p, re.IGNORECASE) for p in TIME_PATTERNS]

    # ── public interface ────────────────────────────────────────────────────

    def extract(self, text: str) -> IncidentEntities:
        e = IncidentEntities()
        t = text  # keep original case for some checks

        e.items_stolen  = self._extract_items(t)
        e.amount_lost   = self._extract_amount(t)
        e.weapon_used   = self._extract_weapon(t)
        e.entry_mode    = self._extract_entry_mode(t)
        e.evidence      = self._extract_evidence(t)
        e.time_of_incident = self._extract_time(t)
        e.accused_count = self._extract_accused_count(t)
        e.victim_gender = self._extract_gender(t)
        e.location      = self._extract_location(t)
        e.crime_type_hint = self._hint_crime_type(t)

        return e

    # ── private helpers ─────────────────────────────────────────────────────

    def _extract_items(self, text):
        found = []
        for pattern in self._item_re:
            m = pattern.search(text)
            if m:
                item = m.group(0).strip()
                if item not in found:
                    found.append(item)
        return found[:8]  # cap at 8 items

    def _extract_amount(self, text):
        # "15 hazaar" / "15000 rupaye" / "Rs 45,000"
        hazaar = re.search(r"(\d+)\s*hazaar", text, re.IGNORECASE)
        if hazaar:
            return float(hazaar.group(1)) * 1000

        lakh = re.search(r"(\d+(?:\.\d+)?)\s*lakh", text, re.IGNORECASE)
        if lakh:
            return float(lakh.group(1)) * 100000

        rs = re.search(r"(?:rs\.?|rupay[ae]?)\s*([\d,]+)", text, re.IGNORECASE)
        if rs:
            return float(rs.group(1).replace(",", ""))

        digits = re.search(r"([\d,]{4,})\s*(?:rupay[ae]?|rs|cash)", text, re.IGNORECASE)
        if digits:
            return float(digits.group(1).replace(",", ""))

        return None

    def _extract_weapon(self, text):
        for weapon, patterns in self._weapon_re.items():
            for p in patterns:
                if p.search(text):
                    return weapon
        return None

    def _extract_entry_mode(self, text):
        for mode, patterns in self._entry_re.items():
            for p in patterns:
                if p.search(text):
                    return mode
        return None

    def _extract_evidence(self, text):
        found = []
        for ev, patterns in self._evidence_re.items():
            for p in patterns:
                if p.search(text):
                    found.append(ev)
                    break
        return found

    def _extract_time(self, text):
        for p in self._time_re:
            m = p.search(text)
            if m:
                return m.group(0)
        return None

    def _extract_accused_count(self, text):
        # "do ladke", "teen aadmi", "5 log"
        hinglish = {
            "ek": 1, "do": 2, "teen": 3, "char": 4, "paanch": 5,
            "chhe": 6, "saat": 7, "aath": 8,
        }
        for word, count in hinglish.items():
            if re.search(rf"\b{word}\b", text, re.IGNORECASE):
                return count
        m = re.search(r"(\d+)\s+(?:log|aadmi|ladke|men|people|persons)", text, re.IGNORECASE)
        if m:
            return int(m.group(1))
        return None

    def _extract_gender(self, text):
        female_words = ["mahila", "aurat", "ladki", "woman", "girl", "wife", "biwi", "she", "her"]
        for w in female_words:
            if re.search(rf"\b{w}\b", text, re.IGNORECASE):
                return "female"
        return None

    def _extract_location(self, text):
        location_hints = [
            r"(?:in|at|near|ke paas|mein)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",
            r"([A-Z][a-z]+ (?:road|street|nagar|colony|vihar|market|bazaar|chowk))",
        ]
        for p in location_hints:
            m = re.search(p, text)
            if m:
                return m.group(1)
        return None

    def _hint_crime_type(self, text):
        """Rough crime-type hint for the classifier's rule fallback."""
        t = text.lower()
        if any(w in t for w in ["ghar mein", "house", "dwelling", "flat mein", "andar ghus"]):
            if any(w in t for w in ["chori", "theft", "stole", "le gaya", "churaya"]):
                return "house_theft"
            return "trespass"
        if any(w in t for w in ["otp", "upi", "online", "fraud", "bank call", "investment"]):
            return "online_fraud"
        if any(w in t for w in ["chaku", "knife", "gun", "chheena", "snatch", "loot"]):
            return "robbery"
        if any(w in t for w in ["kidnap", "apaharan", "uthaya", "le gaye"]):
            return "kidnap"
        if any(w in t for w in ["maar diya", "peet", "assault", "laat", "thappad"]):
            if any(w in t for w in ["haddi", "fracture", "toot", "hospital", "serious"]):
                return "grievous_hurt"
            return "hurt"
        if any(w in t for w in ["dhamki", "threat", "maar dunga", "jaan se"]):
            return "threat"
        if any(w in t for w in ["chori", "theft", "stole", "churaya"]):
            return "plain_theft"
        return None