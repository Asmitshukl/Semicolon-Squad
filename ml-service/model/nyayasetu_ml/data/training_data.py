"""
Annotated FIR training corpus — Hinglish / Hindi / English complaints
mapped to BNS sections (multi-label).

Format: list of dicts:
  text       — raw complaint text
  sections   — list of applicable BNS section strings
  entities   — key entity annotations
"""

TRAINING_DATA = [
    # ── HOUSE THEFT + HOUSEBREAKING ──────────────────────────────────────────
    {
        "text": "Mere ghar mein kal raat koi ghus aaya. Main so raha tha tab darwaza tod ke andar aaya aur mera laptop, 15 hazaar cash aur biwi ke gold ke kangan le gaya. Subah uthke dekha to sab khatam. CCTV mein ek banda dikh raha hai kala jacket mein.",
        "sections": ["BNS 305", "BNS 330"],
        "entities": {"crime_type": "house_theft", "items_stolen": ["laptop", "cash", "gold kangans"], "entry_mode": "door broken", "evidence": "CCTV"},
    },
    {
        "text": "Last night someone broke into my house through the kitchen window and stole my mobile phone, purse with 8000 rupees and my wife's gold chain.",
        "sections": ["BNS 305", "BNS 330"],
        "entities": {"crime_type": "house_theft", "items_stolen": ["mobile", "purse", "gold chain"], "entry_mode": "window broken"},
    },
    {
        "text": "Raat ko chor ne mere ghar ka taala tod diya aur andar se TV, refrigerator aur zevar le gaya. Main ghar par nahi tha.",
        "sections": ["BNS 305", "BNS 330"],
        "entities": {"crime_type": "house_theft", "items_stolen": ["TV", "refrigerator", "zevar"], "entry_mode": "lock broken"},
    },
    {
        "text": "Mere flat ki khidki ka shisha tod ke koi andar ghusa aur mera laptop aur camera le gaya.",
        "sections": ["BNS 305", "BNS 330"],
        "entities": {"crime_type": "house_theft", "items_stolen": ["laptop", "camera"], "entry_mode": "window glass broken"},
    },
    # ── ONLINE FRAUD / CHEATING ──────────────────────────────────────────────
    {
        "text": "Mujhe ek call aaya ki mera bank account band hone wala hai. Unhone OTP maanga aur mere account se 45000 rupaye nikal liye. Ye online fraud hai.",
        "sections": ["BNS 318"],
        "entities": {"crime_type": "online_fraud", "amount_lost": 45000, "method": "OTP fraud"},
    },
    {
        "text": "Someone called me pretending to be from SBI bank and asked for my debit card number and OTP. After I gave it, Rs 78000 was debited from my account.",
        "sections": ["BNS 318", "BNS 319"],
        "entities": {"crime_type": "online_fraud", "amount_lost": 78000, "method": "bank impersonation"},
    },
    {
        "text": "UPI fraud hua hai mujhse. Ek banda bola ki wo mujhe kuch paisa bhejega aur mujhse QR code scan karwaya. Mere account se 12000 chale gaye.",
        "sections": ["BNS 318"],
        "entities": {"crime_type": "online_fraud", "amount_lost": 12000, "method": "QR code fraud"},
    },
    {
        "text": "Mujhe Instagram par ek message aaya job offer ke liye. Unhone advance fee maangi 5000 rupaye aur phir ghaib ho gaye. Fake company thi.",
        "sections": ["BNS 318"],
        "entities": {"crime_type": "cheating", "amount_lost": 5000, "method": "job fraud"},
    },
    {
        "text": "Investment scheme mein paisa lagaya tha 2 lakh. Company ne paisa wapas nahi diya. Promoter ka phone bhi band hai ab.",
        "sections": ["BNS 318", "BNS 316"],
        "entities": {"crime_type": "cheating", "amount_lost": 200000, "method": "investment fraud"},
    },
    # ── ROBBERY ─────────────────────────────────────────────────────────────
    {
        "text": "Main ATM se paisa nikal ke aa raha tha. Do ladke bike par aaye, chaku dikhaya aur mere haath se purse cheen ke bhaag gaye. Purse mein 20000 cash tha.",
        "sections": ["BNS 194"],
        "entities": {"crime_type": "robbery", "amount_lost": 20000, "weapon": "knife", "mode": "snatching"},
    },
    {
        "text": "Aaj subah meri chain snatch ho gayi. Ek aadmi cycle par aaya aur mere gale se sone ki chain kheench ke bhaag gaya.",
        "sections": ["BNS 194"],
        "entities": {"crime_type": "robbery", "items_stolen": ["gold chain"], "mode": "chain snatching"},
    },
    # ── ASSAULT / HURT ───────────────────────────────────────────────────────
    {
        "text": "Mere padosi ne mujhse jhagda kiya aur mujhe ghoos maara. Meri naak se khoon aa raha tha. Witnesses hain.",
        "sections": ["BNS 118"],
        "entities": {"crime_type": "hurt", "accused": "neighbour", "injury": "bleeding nose"},
    },
    {
        "text": "Office mein mera colleague mujhe maarne laga bina kisi wajah ke. Usne mujhe laat maari aur thappad maara. Security camera se sab record hai.",
        "sections": ["BNS 118"],
        "entities": {"crime_type": "hurt", "accused": "colleague", "evidence": "CCTV"},
    },
    {
        "text": "Mere saath rasde mein 3 logon ne milke pitai ki. Mere haath ki haddi toot gayi aur sir par chot lagi. Hospital mein admit hoon.",
        "sections": ["BNS 115"],
        "entities": {"crime_type": "grievous_hurt", "injury": "bone fracture, head injury", "accused_count": 3},
    },
    # ── THREAT / INTIMIDATION ────────────────────────────────────────────────
    {
        "text": "Mere ex-boyfriend ne meri WhatsApp par message bheja ki agar main usse nahi milti toh woh mere ghar aake mujhe aur meri family ko maar dega.",
        "sections": ["BNS 351"],
        "entities": {"crime_type": "threat", "method": "WhatsApp", "victim_gender": "female"},
    },
    {
        "text": "Ek aadmi regularly mere dukaan par aata hai aur paisa maangta hai warna dukaan jalane ki dhamki deta hai.",
        "sections": ["BNS 309", "BNS 351"],
        "entities": {"crime_type": "extortion", "target": "shop"},
    },
    # ── KIDNAPPING ───────────────────────────────────────────────────────────
    {
        "text": "Mera 8 saal ka beta kal school se wapas nahi aaya. Kisi ne usse force se ek white Maruti mein bethaya. CCTV footage available hai.",
        "sections": ["BNS 281"],
        "entities": {"crime_type": "kidnap", "victim_age": 8, "victim_type": "child", "vehicle": "white Maruti"},
    },
    # ── MOLESTATION ─────────────────────────────────────────────────────────
    {
        "text": "Bus mein ek aadmi ne mujhe galat tarike se touch kiya aur bhaagne ki koshish ki. Mujhne usse pakad liya. Witnesses hain.",
        "sections": ["BNS 74"],
        "entities": {"crime_type": "molestation", "location": "bus", "victim_gender": "female"},
    },
    # ── MURDER ──────────────────────────────────────────────────────────────
    {
        "text": "Mere bhai ko kisi ne goli maar di. Woh abhi hospital mein hai, doctors ne kaha condition critical hai. Ek witness ne shooter ko pehchan liya hai.",
        "sections": ["BNS 101"],
        "entities": {"crime_type": "murder_attempt", "weapon": "gun", "evidence": "eyewitness"},
    },
    # ── TRESPASS ONLY (no theft) ─────────────────────────────────────────────
    {
        "text": "Mera padosi bina permission ke mere ghar mein ghus aata hai. Aaj bhi woh mere ghar mein andar aa gaya jabki main wahan tha. Koi chori nahi hui.",
        "sections": ["BNS 329"],
        "entities": {"crime_type": "trespass", "accused": "neighbour"},
    },
    # ── FORGERY ─────────────────────────────────────────────────────────────
    {
        "text": "Kisine meri property ke jaali documents banaye aur bank se loan le liya. Original papers mere paas hain par bank woh nahi maan raha.",
        "sections": ["BNS 326", "BNS 318"],
        "entities": {"crime_type": "forgery", "target": "property documents"},
    },
    # ── BREACH OF TRUST ─────────────────────────────────────────────────────
    {
        "text": "Mujhne apne agent ko 3 lakh rupaye diye the flat booking ke liye. Usne na flat diya na paisa wapas kiya. Ab uska phone bhi nahi uthata.",
        "sections": ["BNS 316", "BNS 318"],
        "entities": {"crime_type": "breach_of_trust", "amount_lost": 300000, "accused": "property agent"},
    },
]

# ── Hinglish transliteration patterns (for preprocessing) ───────────────────
HINGLISH_NORMALIZATIONS = {
    "ghar mein ghusa": "house trespass",
    "darwaza tod": "door broken",
    "chori ho gayi": "theft occurred",
    "paisa le gaya": "money taken",
    "maar diya": "assaulted",
    "dhamki di": "threatened",
    "jhooth bola": "cheated",
    "le bhaaga": "ran away with",
    "OTP maanga": "OTP fraud",
}
