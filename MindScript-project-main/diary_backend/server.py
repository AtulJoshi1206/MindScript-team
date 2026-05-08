from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field
from functools import lru_cache
from pathlib import Path
from typing import Optional
import base64
import hashlib
import json
import os
import random
import shutil
import joblib
import string
import re
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request

# ---------- Paths & Model Load ----------

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent

try:
    from dotenv import load_dotenv
    load_dotenv(PROJECT_DIR / ".env")
    load_dotenv(BASE_DIR / ".env")
except ImportError:
    pass

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small")
WHISPER_ALLOWED_LANGUAGES = [
    item.strip().lower()
    for item in os.getenv("WHISPER_ALLOWED_LANGUAGES", "hi,en").split(",")
    if item.strip()
]
WHISPER_PREFERRED_LANGUAGE = os.getenv("WHISPER_PREFERRED_LANGUAGE", "auto").strip().lower()
WHISPER_DISABLE_FALLBACK = os.getenv("WHISPER_DISABLE_FALLBACK", "false").strip().lower() in ("true", "1", "yes")
TTS_DISABLE_FALLBACK = os.getenv("TTS_DISABLE_FALLBACK", "false").strip().lower() in ("true", "1", "yes")
TTS_VOICE = os.getenv("TTS_VOICE", "").strip() or None
TTS_VOICE_HI = os.getenv("TTS_VOICE_HI", "").strip() or TTS_VOICE
TTS_VOICE_EN = os.getenv("TTS_VOICE_EN", "").strip() or TTS_VOICE
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "").strip() or os.getenv("GEMINI_API_KEY", "").strip()
GOOGLE_CHAT_MODEL = os.getenv("GOOGLE_CHAT_MODEL", "gemini-1.5-flash")
GOOGLE_TTS_VOICE = os.getenv("GOOGLE_TTS_VOICE", "hi-IN-Wavenet-D")
GOOGLE_TTS_LANGUAGE = os.getenv("GOOGLE_TTS_LANGUAGE", "hi-IN")
GOOGLE_TTS_HI_VOICE = os.getenv("GOOGLE_TTS_HI_VOICE", GOOGLE_TTS_VOICE)
GOOGLE_TTS_HI_LANGUAGE = os.getenv("GOOGLE_TTS_HI_LANGUAGE", GOOGLE_TTS_LANGUAGE)
GOOGLE_TTS_EN_VOICE = os.getenv("GOOGLE_TTS_EN_VOICE", "en-US-Wavenet-F")
GOOGLE_TTS_EN_LANGUAGE = os.getenv("GOOGLE_TTS_EN_LANGUAGE", "en-US")
GOOGLE_TTS_SPEAKING_RATE = float(os.getenv("GOOGLE_TTS_SPEAKING_RATE", "0.95"))
CHAT_DATA_PATH = BASE_DIR / "formatted_data.json"

model_path = BASE_DIR / "logistic_regression_model.pkl"
vectorizer_path = BASE_DIR / "tfidf_vectorizer.pkl"

loaded_model = joblib.load(model_path)
loaded_vectorizer = joblib.load(vectorizer_path)
CHAT_EXAMPLES = []

if CHAT_DATA_PATH.exists():
    try:
        with CHAT_DATA_PATH.open("r", encoding="utf-8") as f:
            raw_chat_data = json.load(f)
        for item in raw_chat_data:
            context = str(item.get("Context", "")).strip()
            response = str(item.get("Response", "")).strip()
            if context and response:
                CHAT_EXAMPLES.append({"context": context, "response": response})
    except Exception:
        CHAT_EXAMPLES = []

# ---------- Helper Functions ----------

def clamp_score(score: float) -> float:
    return max(0.0, min(1.0, round(float(score), 2)))

def predict_wellness_score(probability: float) -> float:
    return clamp_score(1 - probability)

def categorize_wellness_level(score: float) -> str:
    if 0 <= score <= 0.33:
        return "Needs Support"
    elif 0.34 <= score <= 0.66:
        return "Coping"
    elif 0.67 <= score <= 1:
        return "Thriving"
    return "Invalid Score"

def preprocess_text(text: str) -> str:
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    text = re.sub(r"\s+", " ", text.strip())
    return text

HINDI_DEVANAGARI_RE = re.compile(r"[\u0900-\u097F]")
ROMAN_HINDI_RE = re.compile(
    r"\b("
    r"main|mai|mein|mujhe|mera|meri|mere|tum|tumhe|aap|apko|kaise|kaisa|kaisi|"
    r"kya|kyu|kyun|nahi|nahin|haan|ha|hoon|hun|hai|tha|thi|the|kar|karke|"
    r"lag|lagta|lagti|achha|accha|theek|khush|dukhi|pareshan|darr|dar|"
    r"zindagi|jeevan|kaam|padhai|ghar|dost|baat|batao|samajh|shayad|bas|yaar"
    r")\b",
    re.IGNORECASE,
)

def detect_language(text: str) -> str:
    clean_text = str(text or "").strip()
    if not clean_text:
        return "en"
    if HINDI_DEVANAGARI_RE.search(clean_text):
        return "hi"
    roman_hits = len(ROMAN_HINDI_RE.findall(clean_text))
    word_count = max(1, len(re.findall(r"\b[\w']+\b", clean_text)))
    return "hi" if roman_hits >= 2 or (roman_hits == 1 and word_count <= 8) else "en"

def uses_devanagari(text: str) -> bool:
    return bool(HINDI_DEVANAGARI_RE.search(str(text or "")))

def adjust_wellness_score(text: str, score: float) -> float:
    lower = preprocess_text(text)

    positive_markers = [
        (r"\bhappiest\b", 0.15),
        (r"\bhappier\b", 0.12),
        (r"\bhappy\b", 0.10),
        (r"\bjoyful\b", 0.10),
        (r"\bjoy\b", 0.08),
        (r"\bcalm\b", 0.08),
        (r"\bpeaceful\b", 0.10),
        (r"\bpeace\b", 0.08),
        (r"\bcomplete(ly)?\b", 0.08),
        (r"\baligned\b", 0.08),
        (r"\blaughter\b", 0.10),
        (r"\bsafe\b", 0.08),
        (r"\bhelp people\b", 0.12),
        (r"\bcareer\b", 0.08),
        (r"\bgoal(s)?\b", 0.07),
        (r"\bimprove\b", 0.08),
        (r"\bgrow\b", 0.06),
        (r"\bfuture\b", 0.06),
        (r"\bpurpose\b", 0.08),
        (r"\bbuild\b", 0.06),
        (r"\bgood job\b", 0.12),
        (r"\bdone (a )?good\b", 0.12),
        (r"\bdid (a )?good\b", 0.12),
        (r"\bachha\b", 0.08),
        (r"\bkhush\b", 0.12),
        (r"\btheek\b", 0.06),
    ]

    negative_markers = [
        (r"\bsuicide\b", 0.20),
        (r"\bself harm\b", 0.18),
        (r"\boverdose\b", 0.18),
        (r"\bhopeless\b", 0.12),
        (r"\bworthless\b", 0.12),
        (r"\bdepress(ed|ing)?\b", 0.15),
        (r"\bsad(ness)?\b", 0.12),
        (r"\bcry(ing)?\b", 0.08),
        (r"\banxious\b", 0.08),
        (r"\bpanic\b", 0.10),
        (r"\balone\b", 0.06),
        (r"\bnumb\b", 0.08),
        (r"\bempty\b", 0.08),
        (r"\bdukhi\b", 0.12),
        (r"\bpareshan\b", 0.10),
    ]

    bonus = sum(weight for pattern, weight in positive_markers if re.search(pattern, lower))
    penalty = sum(weight for pattern, weight in negative_markers if re.search(pattern, lower))

    # Overrides to fix unreliable ML base score for obvious entries
    if penalty >= 0.08 and bonus < 0.05:
        # Clear distress: ensure the score stays in 'Needs Support' (Red) range
        return clamp_score(min(score - penalty, 0.30))
        
    if bonus >= 0.08 and penalty < 0.05:
        # Clear positive: ensure the score is in 'Thriving' (Green) range
        return clamp_score(max(score + bonus, 0.75))

    adjusted = score + min(0.30, bonus) - min(0.30, penalty)
    return clamp_score(adjusted)

def run_model_on_text(text: str) -> dict:
    processed = preprocess_text(text)
    X_encoded = loaded_vectorizer.transform([processed])
    prob = loaded_model.predict_proba(X_encoded)[0][1]
    score = predict_wellness_score(prob)
    score = adjust_wellness_score(text, score)
    level = categorize_wellness_level(score)

    return {
        "probability": float(prob),
        "score": float(score),
        "level": level
    }

def build_supportive_message(score: float, level: str) -> str:
    if level == "Thriving":
        return (
            "That feels like a grounded, positive place to be. "
            "Keep noticing what is working and what is giving you energy."
        )
    elif level == "Coping":
        return (
            "You seem to be carrying a mix of things right now. "
            "We can slow it down and make sense of it together."
        )
    elif level == "Needs Support":
        return (
            "It sounds like things are feeling heavy right now. "
            "You do not have to hold all of this alone, and we can take it one step at a time."
        )
    else:
        return (
            "I'm here with you. "
            "Tell me a little more about what feels most important right now."
        )

def build_chat_system_prompt(user_name: Optional[str], mental_score: Optional[float], user_language: str) -> str:
    name = user_name or "there"
    score_text = f"Current mental wellness score: {mental_score} on a 0 to 1 scale, where 0 means depressed/needs support and 1 means doing well." if mental_score is not None else "Current mental wellness score: unknown."
    language_rule = (
        "The current user message is Hindi. Reply in Hindi only. If the user wrote Devanagari, use Devanagari. "
        "If the user wrote Roman Hindi, use natural Roman Hindi. Do not translate Hindi into English."
        if user_language == "hi"
        else
        "The current user message is English. Reply in English only. Do not switch into Hindi unless the user switches."
    )

    return (
        "You are MindScript, a warm, friendly, psychologist-informed wellness counsellor.\n"
        f"Speak to the user as {name} when natural.\n"
        f"{score_text}\n"
        f"{language_rule}\n"
        "Write 2 to 4 short sentences.\n"
        "Participate in the conversation like a caring counsellor: reflect the feeling, validate it, and ask one specific question when useful.\n"
        "Be friendly and human, but do not use fake slang or random filler.\n"
        "For Hindi, use simple, natural everyday Hindi. Avoid awkward literal translations and avoid overusing Hinglish.\n"
        "For English, use warm conversational English.\n"
        "Do not reuse fixed filler lines such as 'main yahin hoon', 'yeh feeling real lag rahi hai', or 'thoda aur batao' in every reply.\n"
        "Do not give generic motivational quotes. Do not make random comments unrelated to what the user said.\n"
        "Do not sound generic, repetitive, or robotic.\n"
        "Do not diagnose or prescribe.\n"
        "If the user shares distress, respond with care and grounded support.\n"
        "If the user mentions self-harm or immediate danger, encourage contacting local emergency services or a crisis hotline right away.\n"
        "Avoid repeating the user's exact phrasing unless mirroring feels natural.\n"
    )

def shorten_chat_example(text: str) -> str:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    snippet = " ".join(parts[:1]).strip()
    if len(snippet) > 160:
        snippet = snippet[:160].rsplit(" ", 1)[0].rstrip() + "..."
    return snippet

def tokenize_for_overlap(text: str) -> set[str]:
    cleaned = preprocess_text(text)
    return {token for token in cleaned.split(" ") if len(token) > 2}

def pick_chat_examples(user_text: str, count: int = 2) -> list[dict]:
    if not CHAT_EXAMPLES:
        return []
    if detect_language(user_text) == "hi":
        return []

    user_tokens = tokenize_for_overlap(user_text)

    scored_examples = []
    for example in CHAT_EXAMPLES:
        context_tokens = tokenize_for_overlap(example["context"])
        overlap = len(user_tokens & context_tokens)
        scored_examples.append((overlap, len(example["context"]), {
            "context": example["context"],
            "response": shorten_chat_example(example["response"]),
        }))

    scored_examples.sort(key=lambda item: (item[0], -item[1]), reverse=True)
    top = [item[2] for item in scored_examples[: max(count * 3, count)] if item[0] > 0]

    if len(top) < count:
        remaining = [item[2] for item in scored_examples if item[2] not in top]
        top.extend(random.sample(remaining, k=min(count - len(top), len(remaining))))

    return top[:count]

def normalize_chat_history(history):
    messages = []
    for item in history[-6:]:
        role = item.role.strip().lower()
        if role == "model":
            role = "assistant"
        elif role not in {"user", "assistant", "system"}:
            role = "user"
        messages.append({"role": role, "content": item.text.strip()})
    return messages

def call_ollama_chat(messages: list[dict]) -> Optional[str]:
    payload = {
        "model": OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": 0.9,
            "top_p": 0.92,
            "repeat_penalty": 1.15,
            "num_predict": 140,
        },
    }

    request = urllib.request.Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
            content = data.get("message", {}).get("content", "").strip()
            return content or None
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError, json.JSONDecodeError):
        return None

def gemini_contents_from_messages(messages: list[dict]) -> tuple[str, list[dict]]:
    system_parts = []
    contents = []
    for message in messages:
        content = message.get("content", "").strip()
        if not content:
            continue
        role = message.get("role", "user")
        if role == "system":
            system_parts.append(content)
        else:
            contents.append({
                "role": "model" if role == "assistant" else "user",
                "parts": [{"text": content}],
            })
    return "\n".join(system_parts), contents

def call_google_chat(messages: list[dict]) -> Optional[str]:
    if not GOOGLE_API_KEY:
        return None

    system_instruction, contents = gemini_contents_from_messages(messages)
    payload = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.85,
            "topP": 0.9,
            "maxOutputTokens": 256,
            "thinkingConfig": {"thinkingBudget": 0},
        },
    }
    if system_instruction:
        payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GOOGLE_CHAT_MODEL}:generateContent?key={GOOGLE_API_KEY}"
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            data = json.loads(response.read().decode("utf-8"))
            parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            text = " ".join(str(part.get("text", "")).strip() for part in parts).strip()
            return text or None
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError, json.JSONDecodeError):
        return None

def postprocess_reply(reply: str, user_text: str, history: list[ChatMessage]) -> str:
    cleaned = re.sub(r"\s+", " ", reply).strip().strip('"')
    cleaned = re.sub(r"^(mindscript\s*:\s*)", "", cleaned, flags=re.IGNORECASE).strip()
    banned_repeats = [
        "Haan {name}, main yahin hoon. Yeh feeling kaafi real lag rahi hai, bas thoda aur batao na.",
        "Haan, main yahin hoon. Yeh feeling kaafi real lag rahi hai, bas thoda aur batao na.",
    ]
    recent_bot_texts = [item.text.strip().lower() for item in history[-6:] if item.role.lower() == "model"]
    if cleaned.lower() in recent_bot_texts or cleaned in banned_repeats:
        return build_local_fallback_reply(user_text, history)
    return cleaned

def is_incomplete_reply(reply: Optional[str]) -> bool:
    if not reply:
        return True
    clean_reply = re.sub(r"\s+", " ", reply).strip()
    if len(clean_reply) < 18:
        return True
    words = re.findall(r"\b[\w\u0900-\u097F']+\b", clean_reply)
    if len(words) < 5:
        return True
    incomplete_endings = {
        "to", "and", "but", "or", "because", "that", "this", "the", "a", "an",
        "यह", "ये", "और", "लेकिन", "क्योंकि", "कि", "तो", "पर", "में", "से",
    }
    return words[-1].lower() in incomplete_endings

def is_wrong_language_reply(reply: Optional[str], expected_language: str) -> bool:
    if not reply or expected_language not in {"hi", "en"}:
        return False
    reply_language = detect_language(reply)
    return reply_language != expected_language

def build_local_fallback_reply(user_text: str, history: list[ChatMessage]) -> str:
    lower = preprocess_text(user_text)
    language = detect_language(user_text)
    
    # Detect severity - self-harm, suicide
    severity_en = re.search(r"\b(hurt|harm|kill|suicide|die|death|end it|cut|blade|rope|overdose|disappear)\b", lower)
    severity_hi = re.search(r"(चोट|नुकसान|मौत|मर|आत्महत्या|खुद को|ख़त्म|बस|ठीक नहीं)", user_text)
    is_severe = severity_en or severity_hi
    
    options = []
    
    if is_severe:
        if language == "hi" and uses_devanagari(user_text):
            options = [
                "मेरी चिंता है तुम्हारे बारे में। क्या तुम किसी विश्वसनीय व्यक्ति को बता सकते हो? कृपया आत्महत्या निवारण हेल्पलाइन को कॉल करो - 1071।",
                "तुम महत्वपूर्ण हो। यह भावना गुजर जाएगी, लेकिन अभी तुम्हें मदद चाहिए। क्या तुम किसी डॉक्टर से बात कर सकते हो?",
            ]
        elif language == "hi":
            options = [
                "Meri chinta hai tumhare baare mein. Kya tum ksi vishwasaneeya vyakti ko bata sakte ho? Aatmahatya Navaaran Helpline: 1071",
                "Tum important ho. Yeh feeling theek ho jayega, lekin abhi tumhe madad chahiye. Doctor se baat kar sakte ho?",
            ]
        else:
            options = [
                "I'm really concerned about you. Please reach out to someone you trust or call National Suicide Prevention Lifeline: 988 (US).",
                "You matter so much. This feeling will pass, but you need support right now. Please talk to a mental health professional.",
            ]
    elif language == "hi" and re.search(r"\b(khush|achha|accha|theek|better|good|job|proud|garv)\b", lower):
        options = [
            "Yeh sunke bahut khushi hui. Is achhaye ko kaise zyada dinon tak rakh sakte ho?",
            "Bahut achi baat hai. Aisa kya hua jisse ye positive badlav aaya?",
            "Tumhe garv hona chahiye. Tumhare hisaab se sabse important kya tha?",
            "Behatreen. Isko aur bhi gahari nazar se dekh sakte ho?",
        ]
    elif language == "hi" and re.search(r"\b(dukhi|pareshan|tension|stress|stressed|akela|dar|darr|thak|depress|udaas|ghabra)\b", lower):
        options = [
            "Yeh kaafi heavy lag raha hai. Tum akele nahi ho. Sabse bada dard kaun sa hai?",
            "Samajh rahi hoon. Yeh feeling kab se? Kisi specific event ke baad shuru hua?",
            "Mujhe batao, sabse strong emotion kaun sa hai? Dard, dar, ya stress?",
            "Theek hai, dheere dheere samjhte hain. Sabse zyada dukh dene wali baat kya hai?",
        ]
    elif language == "hi" and uses_devanagari(user_text):
        if re.search(r"(खुश|अच्छा|बेहतर|गर्व|कामयाब|सुकून)", user_text):
            options = [
                "यह सुनकर बहुत खुशी हुई। इस अच्छाई को कैसे ज़्यादा दिनों तक बनाए रख सकते हो?",
                "बहुत अच्छी बात है। ऐसा क्या हुआ जिससे ये सकारात्मक परिवर्तन आया?",
                "तुम्हें गर्व होना चाहिए। तुम्हारे हिसाब से इसमें सबसे ज़रूरी चीज़ क्या थी?",
            ]
        elif re.search(r"(दुख|परेशान|तनाव|डर|अकेला|उदास|थक|घबर|निराश|दर्द)", user_text):
            options = [
                "यह काफ़ी भारी लग रहा है। तुम अभी अकेले नहीं हो। सबसे तकलीफ़ देह बात कौन सी है?",
                "समझ रही हूँ। यह भावना कब से तुम्हारे साथ है? क्या किसी ख़ास घटना के बाद शुरू हुआ?",
                "मुझे बताओ, इस समय तुम्हारे अंदर कौन सी भावना सबसे ज़्यादा मजबूत है? दर्द, डर, या कुछ और?",
                "ठीक है, हम इसे धीरे-धीरे समझते हैं। क्या तुम एक छोटी सी बात साझा कर सकते हो जो सबसे ज़्यादा दुख दे रही है?",
            ]
        else:
            options = [
                "मैं समझ रही हूँ। तुम्हारे लिए इस बात का सबसे ज़्यादा मायने क्या है?",
                "ठीक है, मैं सुन रही हूँ। बताओ, तुम्हारे अंदर अभी कौन सी भावना चल रही है?",
                "मुझे थोड़ा और जानने दो। यह कब से चल रहा है और इसका तुम पर क्या असर हो रहा है?",
                "हाँ, मैं यहाँ हूँ। इस समय तुम्हें क्या सबसे ज़्यादा परेशान कर रहा है?",
            ]
    elif language == "hi":
        options = [
            "Samajh rahi hoon. Is baat ka tumhare liye sabse zyada matlab kya hai?",
            "Theek hai, mein sun rahi hoon. Batao, tumhare andar kaun si bhavna chal rahi hai?",
            "Mujhe thoda or janne do. Yeh kab se chal raha hai aur iska tumpar kya asar pad raha hai?",
            "Haan, main yahan hoon. Abhi tumhe kya sabse zyada pareshan kar raha hai?",
        ]
    elif re.search(r"\b(happy|good|great|better|job|proud|improve|strength|strong|well)\b", lower):
        options = [
            "That's wonderful. What helped you feel this way today?",
            "I'm so glad you're noticing this positive change. How can you hold onto this feeling?",
            "That sounds like real progress. What part of it are you most proud of?",
            "That's beautiful. What would help you feel this way more often?",
        ]
    elif re.search(r"\b(sad|down|tired|anxious|panic|alone|empty|stress|stressed|depress|upset|helpless|hopeless|miserable|overwhelmed|broken)\b", lower):
        options = [
            "That sounds really hard. You're not alone in this. What hurts the most right now?",
            "I hear the pain in what you're sharing. When did this start feeling so heavy?",
            "Take a breath. What's the one thing that feels most overwhelming for you?",
            "I'm listening and I care. Can you tell me the hardest part of what you're carrying?",
            "It sounds like you're dealing with a lot. What emotion is strongest right now?",
        ]
    else:
        options = [
            "I'm here and listening. What matters most to you about what you just shared?",
            "Tell me more. How is that affecting you?",
            "I'm listening. When did this feeling start?",
            "What's the core of what you're experiencing right now?",
            "Help me understand. What's the biggest challenge for you in this situation?",
        ]

    recent = {item.text.strip().lower() for item in history[-10:] if item.role.lower() == "model"}
    seed = int(hashlib.sha256((user_text + str(len(history))).encode("utf-8")).hexdigest(), 16)
    ordered = options[seed % len(options):] + options[:seed % len(options)]
    return next((option for option in ordered if option.lower() not in recent), ordered[0])


@lru_cache(maxsize=1)
def get_whisper_model():
    try:
        import whisper
    except ImportError as exc:
        raise RuntimeError("whisper is not installed") from exc

    return whisper.load_model(WHISPER_MODEL)

def transcript_tokens(text: str) -> list[str]:
    return re.findall(r"[\w\u0900-\u097F']+", str(text or "").lower())

def has_repetitive_hallucination(text: str) -> bool:
    tokens = transcript_tokens(text)
    if len(tokens) < 6:
        return False

    counts = {}
    for token in tokens:
        counts[token] = counts.get(token, 0) + 1

    most_common = max(counts.values())
    unique_ratio = len(counts) / len(tokens)
    most_common_ratio = most_common / len(tokens)

    longest_run = 1
    current_run = 1
    for index in range(1, len(tokens)):
        if tokens[index] == tokens[index - 1]:
            current_run += 1
            longest_run = max(longest_run, current_run)
        else:
            current_run = 1

    return longest_run >= 4 or most_common_ratio >= 0.35 or unique_ratio <= 0.35

def is_bad_transcript(text: str, result: Optional[dict] = None) -> bool:
    clean_text = re.sub(r"\s+", " ", str(text or "").strip())
    if len(clean_text) < 2:
        return True
    if has_repetitive_hallucination(clean_text):
        return True

    segments = (result or {}).get("segments") or []
    if segments:
        no_speech_prob = sum(float(seg.get("no_speech_prob", 0.0)) for seg in segments) / len(segments)
        avg_logprob = sum(float(seg.get("avg_logprob", -1.0)) for seg in segments) / len(segments)
        if no_speech_prob > 0.65 or avg_logprob < -1.25:
            return True

    return False

def transcribe_audio_file(audio_path: Path) -> dict:
    model = get_whisper_model()
    candidates = []

    languages_to_try: list[Optional[str]] = []
    if WHISPER_PREFERRED_LANGUAGE in {"hi", "en"}:
        languages_to_try.append(WHISPER_PREFERRED_LANGUAGE)
    else:
        languages_to_try.append(None)
    for language_code in WHISPER_ALLOWED_LANGUAGES:
        if language_code in {"hi", "en"} and language_code not in languages_to_try:
            languages_to_try.append(language_code)

    for language_code in languages_to_try:
        prompt = (
            "यह एक हिंदी या अंग्रेज़ी wellness conversation है. शब्दों को सही भाषा में ही लिखो, translate मत करो."
            if language_code == "hi"
            else
            "This is a Hindi or English wellness conversation. Transcribe the exact spoken language; do not translate."
        )
        result = model.transcribe(
            str(audio_path),
            fp16=False,
            task="transcribe",
            language=language_code,
            initial_prompt=prompt,
            condition_on_previous_text=False,
            temperature=0,
            beam_size=5,
            compression_ratio_threshold=2.2,
            logprob_threshold=-1.0,
            no_speech_threshold=0.55,
            verbose=False,
        )
        text = re.sub(r"\s+", " ", str(result.get("text", "")).strip()).strip()
        detected_language = (result.get("language") or language_code or "").lower() or None
        if text:
            candidate_score = score_transcript_candidate(text, detected_language, language_code, result)
            if is_bad_transcript(text, result):
                candidate_score -= 10.0
            candidates.append({
                "text": text,
                "language": detected_language,
                "score": candidate_score,
                "bad": is_bad_transcript(text, result),
            })

    if not candidates:
        return {"text": "", "language": None}

    candidates.sort(key=lambda item: item["score"], reverse=True)
    best = candidates[0]
    if best.get("bad"):
        return {"text": "", "language": None}
    return {
        "text": best["text"],
        "language": best["language"] if best["language"] in {"hi", "en"} else detect_language(best["text"]),
    }

def score_transcript_candidate(text: str, detected_language: Optional[str], forced_language: Optional[str], result: dict) -> float:
    score = 0.0
    normalized_language = (detected_language or "").lower()
    text_language = detect_language(text)

    if normalized_language in {"hi", "en"}:
        score += 4.0
    else:
        score -= 4.0

    if forced_language in {"hi", "en"}:
        score += 1.0
    if text_language == normalized_language:
        score += 2.0
    if text_language == forced_language:
        score += 2.0

    word_count = len(re.findall(r"\b[\w\u0900-\u097F']+\b", text))
    score += min(word_count, 20) / 10

    if text_language == "hi":
        score += 1.0
    if uses_devanagari(text):
        score += 1.0
    if has_repetitive_hallucination(text):
        score -= 10.0

    suspicious = re.findall(r"[^\w\s\u0900-\u097F.,!?'-]", text)
    score -= min(len(suspicious), 10) * 0.2

    segments = result.get("segments") or []
    if segments:
        avg_logprob = sum(float(seg.get("avg_logprob", -1.0)) for seg in segments) / len(segments)
        no_speech_prob = sum(float(seg.get("no_speech_prob", 0.0)) for seg in segments) / len(segments)
        score += avg_logprob
        score -= no_speech_prob * 2

    return score

def transcribe_audio_file_legacy(audio_path: Path) -> dict:
    model = get_whisper_model()
    result = model.transcribe(
        str(audio_path),
        fp16=False,
        task="transcribe",
        language=None,
        verbose=False,
    )
    text = str(result.get("text", "")).strip()
    language = result.get("language")
    return {
        "text": re.sub(r"\s+", " ", text).strip(),
        "language": language if language else None,
    }

def transcribe_audio_file_with_google(audio_path: Path, mime_type: Optional[str]) -> Optional[dict]:
    if not GOOGLE_API_KEY:
        return None

    audio_bytes = audio_path.read_bytes()
    payload = {
        "contents": [{
            "role": "user",
            "parts": [
                {
                    "text": (
                        "Transcribe this audio accurately. Do not translate it. "
                        "Preserve the spoken language exactly: Hindi speech stays Hindi, English speech stays English, "
                        "and mixed speech stays mixed. Return only the transcript, no comments."
                    )
                },
                {
                    "inlineData": {
                        "mimeType": mime_type or "audio/webm",
                        "data": base64.b64encode(audio_bytes).decode("utf-8"),
                    }
                },
            ],
        }],
        "generationConfig": {
            "temperature": 0,
            "maxOutputTokens": 220,
        },
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GOOGLE_CHAT_MODEL}:generateContent?key={GOOGLE_API_KEY}"
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=35) as response:
            data = json.loads(response.read().decode("utf-8"))
            parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            text = " ".join(str(part.get("text", "")).strip() for part in parts).strip()
            text = re.sub(r"^(transcript\s*:\s*)", "", text, flags=re.IGNORECASE).strip()
            if not text:
                return None
            return {"text": re.sub(r"\s+", " ", text), "language": None, "source": "google"}
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError, json.JSONDecodeError):
        return None

def tts_settings_for_text(text: str) -> tuple[str, str]:
    if detect_language(text) == "hi":
        return GOOGLE_TTS_HI_LANGUAGE, GOOGLE_TTS_HI_VOICE
    return GOOGLE_TTS_EN_LANGUAGE, GOOGLE_TTS_EN_VOICE

def local_tts_voice_for_text(text: str, requested_voice: Optional[str] = None) -> Optional[str]:
    if requested_voice:
        return requested_voice
    if detect_language(text) == "hi":
        return TTS_VOICE_HI
    return TTS_VOICE_EN

def synthesize_tts_audio_with_google(text: str) -> Optional[bytes]:
    if not GOOGLE_API_KEY:
        return None

    clean_text = re.sub(r"\s+", " ", str(text)).strip()
    if not clean_text:
        raise ValueError("Text is empty")

    language_code, voice_name = tts_settings_for_text(clean_text)
    payload = {
        "input": {"text": clean_text},
        "voice": {
            "languageCode": language_code,
            "name": voice_name,
        },
        "audioConfig": {
            "audioEncoding": "LINEAR16",
            "speakingRate": GOOGLE_TTS_SPEAKING_RATE,
        },
    }
    url = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={GOOGLE_API_KEY}"
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            data = json.loads(response.read().decode("utf-8"))
            audio_content = data.get("audioContent")
            return base64.b64decode(audio_content) if audio_content else None
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError, json.JSONDecodeError):
        return None

def synthesize_tts_audio(text: str, voice: Optional[str] = None) -> bytes:
    clean_text = re.sub(r"\s+", " ", str(text)).strip()
    if not clean_text:
        raise ValueError("Text is empty")

    tts_voice = local_tts_voice_for_text(clean_text, voice)

    with tempfile.TemporaryDirectory(prefix="mindscript-tts-") as tmpdir:
        tmpdir_path = Path(tmpdir)
        aiff_path = tmpdir_path / "reply.aiff"
        wav_path = tmpdir_path / "reply.wav"

        if sys.platform == "darwin" and shutil.which("say"):
            cmd = ["say"]
            if tts_voice:
                cmd.extend(["-v", tts_voice])
            cmd.extend(["-o", str(aiff_path), clean_text])
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            try:
                import pyttsx3
            except ImportError as exc:
                raise RuntimeError("No local TTS engine available") from exc

            engine = pyttsx3.init()
            if tts_voice:
                engine.setProperty("voice", tts_voice)
            engine.save_to_file(clean_text, str(aiff_path))
            engine.runAndWait()

        try:
            subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-i",
                    str(aiff_path),
                    "-ar",
                    "22050",
                    "-ac",
                    "1",
                    str(wav_path),
                ],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            raise RuntimeError(
                "FFmpeg is not installed or failed. To use local TTS on Windows: "
                "1) Install FFmpeg: choco install ffmpeg (via Chocolatey) or download from https://ffmpeg.org/download.html "
                "2) Restart the backend server. \n"
                "Or set TTS_DISABLE_FALLBACK=true in .env to use only Google Text-to-Speech API (requires GOOGLE_API_KEY)."
            ) from e

        return wav_path.read_bytes()

# ---------- FastAPI App ----------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class DiaryRequest(BaseModel):
    text: str

class DiaryResponse(BaseModel):
    score: float
    message: str
    probability: float
    level: str

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = Field(default_factory=list)
    user_name: Optional[str] = None
    mental_score: Optional[float] = None

class ChatResponse(BaseModel):
    reply: str
    source: str
    model: Optional[str] = None

class TranscribeResponse(BaseModel):
    text: str
    language: Optional[str] = None
    source: str = "local"

class SpeakRequest(BaseModel):
    text: str
    voice: Optional[str] = None

@app.post("/analyze-diary", response_model=DiaryResponse)
def analyze_diary(req: DiaryRequest):
    result = run_model_on_text(req.text)
    msg = build_supportive_message(result["score"], result["level"])
    return DiaryResponse(
        score=result["score"],
        message=msg,
        probability=result["probability"],
        level=result["level"]
    )

@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    user_language = detect_language(req.message)
    system_prompt = build_chat_system_prompt(req.user_name, req.mental_score, user_language)
    recent_history = normalize_chat_history(req.history)
    few_shot_examples = []
    for example in pick_chat_examples(req.message, count=1):
        few_shot_examples.append({"role": "user", "content": example["context"]})
        few_shot_examples.append({"role": "assistant", "content": example["response"]})

    messages = [
        {"role": "system", "content": system_prompt},
        *few_shot_examples,
        *recent_history,
        {"role": "user", "content": req.message.strip()},
    ]

    reply = call_google_chat(messages)
    if reply and not is_incomplete_reply(reply) and not is_wrong_language_reply(reply, user_language):
        return ChatResponse(
            reply=postprocess_reply(reply, req.message, req.history),
            source="google",
            model=GOOGLE_CHAT_MODEL,
        )

    reply = call_ollama_chat(messages)
    if reply and not is_incomplete_reply(reply) and not is_wrong_language_reply(reply, user_language):
        return ChatResponse(
            reply=postprocess_reply(reply, req.message, req.history),
            source="ollama",
            model=OLLAMA_MODEL,
        )

    fallback_reply = build_local_fallback_reply(req.message, req.history)
    return ChatResponse(reply=fallback_reply, source="fallback", model=None)

@app.post("/transcribe-audio", response_model=TranscribeResponse)
async def transcribe_audio(file: UploadFile = File(...)):
    suffix = Path(file.filename or "voice.webm").suffix or ".webm"
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix, prefix="mindscript-voice-") as tmp_file:
            temp_path = Path(tmp_file.name)
            shutil.copyfileobj(file.file, tmp_file)

        result = transcribe_audio_file_with_google(temp_path, file.content_type)
        if result is None:
            if WHISPER_DISABLE_FALLBACK:
                raise HTTPException(
                    status_code=503,
                    detail="Google Speech-to-Text API is not available or failed. "
                           "Local FFmpeg fallback is disabled. Please ensure GOOGLE_API_KEY is set and valid."
                )
            try:
                result = transcribe_audio_file(temp_path)
                result["source"] = "local"
            except FileNotFoundError as e:
                raise HTTPException(
                    status_code=500,
                    detail="FFmpeg is not installed. To use audio transcription on Windows: "
                           "1) Install FFmpeg: choco install ffmpeg (via Chocolatey) or download from https://ffmpeg.org/download.html "
                           "2) Restart the backend server. \n"
                           "Or set WHISPER_DISABLE_FALLBACK=true in .env to use only Google Speech-to-Text API (requires GOOGLE_API_KEY)."
                )
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Audio transcription failed: {str(e)}")
        if not result["text"]:
            raise HTTPException(status_code=400, detail="No speech detected in audio")

        return TranscribeResponse(**result)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        try:
            file.file.close()
        except Exception:
            pass
        if temp_path and temp_path.exists():
            try:
                temp_path.unlink()
            except Exception:
                pass

@app.post("/speak")
def speak(req: SpeakRequest):
    try:
        audio_bytes = synthesize_tts_audio_with_google(req.text)
        if audio_bytes is None:
            if TTS_DISABLE_FALLBACK:
                raise HTTPException(
                    status_code=503,
                    detail="Google Text-to-Speech API is not available or failed. "
                           "Local TTS fallback is disabled. Please ensure GOOGLE_API_KEY is set and valid."
                )
            audio_bytes = synthesize_tts_audio(req.text, req.voice)
        if audio_bytes is None:
            raise HTTPException(status_code=500, detail="TTS synthesis failed - no audio generated")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return Response(
        content=audio_bytes,
        media_type="audio/wav",
        headers={"Cache-Control": "no-store"},
    )

# ---------- File-based Storage API ----------

STORAGE_FILE = BASE_DIR / "mindscript_db.json"

def load_db():
    if not STORAGE_FILE.exists():
        return {}
    try:
        with STORAGE_FILE.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def save_db(data):
    try:
        with STORAGE_FILE.open("w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving DB: {e}")

@app.get("/storage/{key}")
def get_storage(key: str):
    db = load_db()
    return {"value": db.get(key)}

@app.post("/storage/{key}")
async def set_storage(key: str, req: dict):
    # Expecting {"value": ...}
    db = load_db()
    db[key] = req.get("value")
    save_db(db)
    return {"status": "success"}

@app.post("/storage-batch")
async def batch_set_storage(req: dict):
    # Expecting {"data": {"key1": "val1", "key2": "val2"}}
    db = load_db()
    updates = req.get("data", {})
    db.update(updates)
    save_db(db)
    return {"status": "success", "count": len(updates)}
