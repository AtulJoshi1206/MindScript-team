from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import joblib
import string
import re

# ---------- Paths & Model Load ----------

BASE_DIR = Path(__file__).resolve().parent

model_path = BASE_DIR / "logistic_regression_model.pkl"
vectorizer_path = BASE_DIR / "tfidf_vectorizer.pkl"

loaded_model = joblib.load(model_path)
loaded_vectorizer = joblib.load(vectorizer_path)

# ---------- Helper Functions ----------

def predict_and_score(probability: float) -> int:
    return int(probability * 100)

def categorize_depression_level(score: int) -> str:
    if 0 <= score <= 33:
        return "Low"
    elif 34 <= score <= 66:
        return "Moderate"
    elif 67 <= score <= 100:
        return "High"
    return "Invalid Score"

def preprocess_text(text: str) -> str:
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    text = re.sub(r"\s+", " ", text.strip())
    return text

def run_model_on_text(text: str) -> dict:
    processed = preprocess_text(text)
    X_encoded = loaded_vectorizer.transform([processed])
    prob = loaded_model.predict_proba(X_encoded)[0][1]
    score = predict_and_score(prob)
    level = categorize_depression_level(score)

    return {
        "probability": float(prob),
        "score": int(score),
        "level": level
    }

def build_supportive_message(score: int, level: str) -> str:
    if level == "High":
        return (
            "Lagta hai tum kaafi heavy aur overwhelmed feel kar rahi ho. "
            "Tum akeli nahi ho, main yahin hoon… agar theek lage to thoda aur batao?"
        )
    elif level == "Moderate":
        return (
            "Mujhe lagta hai tum kuch stress ya udaasi se guzar rahi ho. "
            "Main yahan hoon — hum dheere se samajh lenge."
        )
    else:
        return (
            "Achha hai ki tum relatively theek ho. "
            "Agar kuch share karna chaho to main hoon."
        )

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
    score: int
    message: str
    probability: float
    level: str

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
