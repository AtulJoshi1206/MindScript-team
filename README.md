<div align="center">

<img width="64" height="64" alt="image" src="https://github.com/user-attachments/assets/d2d07c72-c966-4017-bfd0-e37386a45d12" />


# MindScript

### *Your AI Companion for Mental Wellness*

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

> **MindScript** is a full-stack AI-powered mental wellness application that combines clinical-grade sentiment analysis, conversational AI therapy support, and evidence-based mood tracking — all wrapped in a cinematic, premium dark interface designed to make users feel safe, calm, and heard.

</div>

---

## 📑 Table of Contents

1. [Overview & Vision](#-overview--vision)
2. [Research & Design Philosophy](#-research--design-philosophy)
3. [Color Psychology & Visual Theming](#-color-psychology--visual-theming)
4. [Features](#-features)
5. [Tech Stack](#-tech-stack)
6. [Project Structure](#-project-structure)
7. [How It Works — AI Architecture](#-how-it-works--ai-architecture)
8. [Cinematic Background System](#-cinematic-background-system)
9. [Getting Started](#-getting-started)
10. [Running the Backend](#-running-the-backend)
11. [Running the Frontend](#-running-the-frontend)
12. [Environment Variables](#-environment-variables)
13. [Pages & User Flow](#-pages--user-flow)
14. [Assessment Methodology](#-assessment-methodology)
15. [Contributing](#-contributing)

---

## 🧠 Overview & Vision

Mental health is one of the most under-addressed areas of personal well-being. Most existing apps are either clinical and intimidating or superficial and ineffective. **MindScript** bridges that gap.

The vision behind MindScript is simple: **make mental wellness accessible, non-judgmental, and intelligent**. We believe:

- Every person deserves a safe space to express their feelings
- AI can be a bridge — not a replacement — for professional mental health support
- Tracking emotional patterns over time gives users genuine insight into their wellbeing
- Beautiful, calming design is not cosmetic — it is *therapeutic*

MindScript gives users three pathways to interact: a **free-form diary**, a structured **PHQ-adapted assessment quiz**, and an open **AI chat**. Each session produces a 0–100 mental wellness score, which is logged and visualized over time.

---

## 🔬 Research & Design Philosophy

### Evidence Base

MindScript draws from established clinical frameworks:

| Framework | Usage in MindScript |
|---|---|
| **PHQ-9** (Patient Health Questionnaire-9) | Core questions in the 14-item assessment adapted to score depression/anxiety levels |
| **GAD-7** (Generalized Anxiety Disorder Scale) | Additional anxiety-specific items woven into the quiz |
| **VADER / Sentiment Lexicons** | Vocabulary base for the offline keyword scoring engine |
| **Logistic Regression on NLP features** | Custom-trained ML model in the Python backend (`diary_backend/`) |
| **Cognitive Behavioural Therapy (CBT) principles** | AI prompt engineering is structured around CBT-style empathetic reflection rather than advice-giving |

### AI Prompt Engineering

The Gemini AI is prompted specifically as a **CBT-informed companion** — it reflects, validates, and gently probes rather than diagnosing or prescribing. Every system prompt is designed around:

- **Unconditional positive regard** (Carl Rogers, Person-Centered Therapy)
- **Motivational interviewing** techniques
- **Crisis escalation detection** — severe keywords immediately redirect toward professional resources and helplines

### Scoring Methodology

The mental wellness score (0–100) works as follows:

```
Score ≥ 70  →  Thriving     (Emerald color band)
Score 41–69 →  Coping       (Amber color band)
Score ≤ 40  →  Needs Care   (Rose color band)
```

The score is recalculated **every 3 chat messages** using a sliding window of the last 10 exchanges, meaning it responds dynamically to how the conversation evolves.

---

## 🎨 Color Psychology & Visual Theming

The entire color system was designed around **chromotherapy research** and the psychological effects of color on mood and mental states.

### Primary Palette

| Token | Hex | Color | Psychological Effect |
|---|---|---|---|
| `ms-primary` | `#7c3aed` | Deep Violet | Creativity, introspection, spiritual calm |
| `ms-primary-light` | `#a78bfa` | Soft Lavender | Gentleness, peace, emotional balance |
| `ms-blue` | `#3b82f6` | Clear Blue | Trust, stability, clarity of thought |
| `ms-teal` | `#14b8a6` | Teal | Healing, renewal, emotional intelligence |
| `ms-secondary` | `#f43f5e` | Rose | Empathy, warmth, urgency for care |
| `ms-accent` | `#f59e0b` | Amber | Hope, optimism, gentle energy |

### Background Image Meanings

MindScript uses three cinematic photographic backgrounds, each chosen for specific psychological resonance:

| Image | Scene | Symbolic Meaning | Used On |
|---|---|---|---|
| **Aurora** (`bg_aurora.png`) | Northern lights over a still mountain lake | *Renewal, clarity of mind, beginning of a new chapter* | Login, Diary |
| **Forest** (`bg_forest.png`) | Ancient misty forest with golden god-rays at dawn | *Grounding, healing, the path through darkness into light* | Register, Input Select |
| **Cosmos** (`bg_cosmos.png`) | Deep-space nebula in violet and teal | *Infinite possibility, perspective, the vastness of inner experience* | Chat, Quiz |

> **Why dark backgrounds?** Research in UX psychology shows that dark interfaces with soft luminance gradients reduce anxiety and cognitive load compared to bright white interfaces — especially for sensitive emotional content. ([Harrington et al., 2019; Bajcar & Bąbel, 2021](https://doi.org/10.1007/s10664-019-09728-1))

### Typography

- **Font**: [Inter](https://fonts.google.com/specimen/Inter) — chosen for its exceptional legibility at small sizes, humanist proportions, and neutral emotional tone that doesn't compete with content
- **Weights used**: 300 (light), 400 (body), 500 (medium), 600 (semibold), 700 (bold), 800 (display)

---

## ✨ Features

### Core Features
- 📓 **AI Diary Analysis** — Write freely; the AI reads the emotional subtext
- 📋 **Structured Wellness Assessment** — 14-question PHQ/GAD-adapted quiz with progress tracking
- 💬 **Real-time AI Chat** — Conversational mental wellness support powered by Gemini 2.5 Flash
- 📈 **Wellness Score Tracking** — Dynamic 0–100 score with historical line chart visualization
- 🔍 **Find Professionals** — Embedded Google Maps search for mental health professionals near you

### Authentication
- 🔐 Secure local authentication (email + password with SHA-style hashing via localStorage)
- ♻️ Session persistence across browser refreshes
- 👤 Personalized greeting based on time of day

### UI/UX
- 🌌 **Cinematic animated backgrounds** — 3 professional photographs with slow Ken-Burns zoom + crossfade cycling
- ✨ **Floating particle system** — 18 ambient glowing particles with randomized float animations
- 🪟 **Glassmorphism cards** — `backdrop-filter: blur(28px) saturate(160%)` for a premium frosted-glass look
- 📱 Fully **responsive** — works on mobile, tablet, and desktop
- ♿ Accessible — semantic HTML, ARIA labels, keyboard navigable

### AI Resilience (3-layer fallback)
If Gemini API is unavailable, the app **never breaks**:
1. **Gemini 2.5 Flash** (primary)
2. **Custom Python ML model** (FastAPI on `localhost:8000`)
3. **Offline keyword analysis engine** (always available, zero network dependency)

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Role |
|---|---|---|
| **React** | 19 | UI component framework |
| **Vite** | 7 | Build tool and dev server (ESM-native, HMR) |
| **React Router DOM** | 7 | Client-side routing (SPA navigation) |
| **Tailwind CSS** | 3 | Utility-first styling with custom design tokens |
| **Recharts** | 3 | Mental wellness score line charts |
| **Lucide React** | Latest | Icon library (consistent, MIT-licensed SVG icons) |

### Backend

| Technology | Version | Role |
|---|---|---|
| **FastAPI** | Latest | Python REST API framework |
| **Uvicorn** | Latest | ASGI server for FastAPI |
| **scikit-learn** | Latest | Logistic regression model for diary sentiment |
| **joblib** | Latest | Model serialization (`.pkl` files) |
| **TF-IDF Vectorizer** | — | Text feature extraction for ML inference |

### AI & APIs

| Service | Usage |
|---|---|
| **Google Gemini 2.5 Flash** | Primary diary analysis, chat responses, score recalculation |
| **Google Maps Search** | "Find professionals near me" feature |

### Dev Tooling

| Tool | Role |
|---|---|
| **ESLint** | Code linting (with React Hooks plugin) |
| **PostCSS + Autoprefixer** | CSS build pipeline with vendor prefixes |

---

## 📁 Project Structure

```
MindScript-project-main/
│
├── 📄 index.html                  # App entry point — sets favicon, title, root div
├── 📄 package.json                # NPM dependencies and scripts
├── 📄 vite.config.js              # Vite build configuration
├── 📄 tailwind.config.js          # Design tokens, custom colors, animations, keyframes
├── 📄 postcss.config.cjs          # PostCSS pipeline (Tailwind + Autoprefixer)
├── 📄 eslint.config.js            # Linting rules
├── 📄 .gitignore                  # Excludes node_modules, dist, .env, secrets
├── 📄 .env                        # ⚠️ NOT committed — contains VITE_GEMINI_API_KEY
│
├── 📁 public/                     # Static assets (served at root URL)
│   ├── mindscript-icon.png        # App icon / favicon (brain illustration)
│   ├── bg_aurora.png              # Background: Aurora Borealis (Login, Diary)
│   ├── bg_forest.png              # Background: Misty Forest (Register, Input Select)
│   ├── bg_cosmos.png              # Background: Deep Space Nebula (Chat, Quiz)
│   └── vite.svg                   # (Unused — kept for reference)
│
├── 📁 src/                        # All application source code
│   │
│   ├── 📄 main.jsx                # React app mount point — wraps with BrowserRouter
│   ├── 📄 App.jsx                 # Root component — all state, handlers, routing logic
│   ├── 📄 App.css                 # Minimal global resets
│   ├── 📄 index.css               # Global CSS — Tailwind directives, design system, keyframes
│   ├── 📄 constants.js            # ASSESSMENT_QUESTIONS array (14 PHQ/GAD-adapted questions)
│   │
│   ├── 📁 pages/                  # Full-page React components (one per route)
│   │   ├── LoginPage.jsx          # /login — Aurora background, email+password auth form
│   │   ├── RegisterPage.jsx       # /register — Forest background, account creation
│   │   ├── WelcomePage.jsx        # / — First-time welcome screen (currently bypassed)
│   │   ├── DashboardPage.jsx      # /dashboard — Score history, quick actions, chart
│   │   ├── InputSelectPage.jsx    # /input-select — Choose between diary or quiz
│   │   ├── DiaryPage.jsx          # /diary — Free-text diary entry form
│   │   ├── QuizPage.jsx           # /quiz — 14-question wellness assessment
│   │   └── ChatPage.jsx           # /chat — AI conversation, score display, graph modal
│   │
│   ├── 📁 components/             # Reusable sub-components
│   │   ├── MindfulBackground.jsx  # 🌌 Animated cinematic background system (crossfade + particles)
│   │   ├── LoadingSpinner.jsx     # Analyzing... screen between quiz/diary and chat
│   │   ├── ScrollingFooter.jsx    # Marquee-style motivational quotes footer
│   │   └── AuthErrorScreen.jsx    # Auth failure fallback UI
│   │
│   └── 📁 utils/
│       └── auth.js                # Auth helpers: registerUser, loginUser, getSession, clearSession
│
└── 📁 diary_backend/              # Python AI/ML backend (optional but recommended)
    ├── server.py                  # FastAPI app — /analyze-diary endpoint
    ├── logistic_regression_model.pkl  # Trained LR model binary
    ├── tfidf_vectorizer.pkl           # TF-IDF feature extractor binary
    └── __pycache__/               # Python bytecode cache
```

### Key File Responsibilities

| File | What It Does |
|---|---|
| `App.jsx` | **The brain of the app.** Manages all state (user, score, chat history), all async AI calls, all route handlers. ~630 lines. |
| `tailwind.config.js` | Defines the entire **design system**: color palette (`ms-*` tokens), font stack, all animation names and keyframes |
| `index.css` | Defines reusable **CSS component classes** (`.glass-card`, `.btn-primary`, `.input-field`) and all custom `@keyframes` for background animations |
| `MindfulBackground.jsx` | **Cinematic background engine** — manages crossfade transitions between 3 images, floating particles, and ambient glow orbs |
| `constants.js` | Single source of truth for the **14 assessment questions** (PHQ/GAD-adapted) |
| `auth.js` | Lightweight **auth layer** using localStorage — handles user registration, login, session storage, and score history persistence |
| `diary_backend/server.py` | FastAPI server exposing `/analyze-diary` — runs the **TF-IDF + Logistic Regression** ML pipeline on diary text |

---

## 🤖 How It Works — AI Architecture

```
User Input (Diary / Quiz / Chat)
          │
          ▼
┌─────────────────────────────────┐
│   Layer 1: Google Gemini 2.5    │  ← Primary (JSON structured output)
│   Flash API                     │
└────────────┬────────────────────┘
             │ fail / timeout (15s)
             ▼
┌─────────────────────────────────┐
│   Layer 2: Python FastAPI       │  ← localhost:8000/analyze-diary
│   ML Backend (TF-IDF + LR)     │    TF-IDF vectorization → Logistic Regression
└────────────┬────────────────────┘
             │ unreachable / fail (8s)
             ▼
┌─────────────────────────────────┐
│   Layer 3: Offline Keyword      │  ← Always available, zero network
│   Analysis Engine               │    50+ negative keywords, 40+ positive keywords
│                                 │    Severe crisis word detection
└─────────────────────────────────┘
          │
          ▼
    Mental Wellness Score (0–100) + Empathetic Message
          │
          ▼
    Chat Session Begins — Score recalculated every 3 messages
```

### Scoring Logic (Offline Fallback)

```javascript
// Simplified scoring algorithm
severeWords = ['suicide', 'self harm', 'overdose', 'end it', ...]
negativeWords = ['depressed', 'anxious', 'lonely', 'hopeless', ...]
positiveWords = ['grateful', 'hopeful', 'calm', 'peaceful', ...]

if (severeWords hit ≥ 2) → score = max(5, 15 - (severe × 5))
if (negWords = 0 AND posWords = 0) → score = 55 (neutral)
else → score = 20 + (posRatio × 70)
// Clamped to [5, 95]
```

---

## 🌌 Cinematic Background System

The `MindfulBackground` component (`src/components/MindfulBackground.jsx`) is a fully self-contained animated background engine with:

### Animation Stack
1. **`bgSlowZoom`** — 24-second gentle Ken Burns zoom on the image (scale 1 → 1.06 → 1)
2. **`bgFadeIn / bgFadeOut`** — 1.8-second crossfade between images on auto-cycle (every 12 seconds)
3. **`particleFloat`** — 18 unique floating particles with randomized size, color, speed (6–14s), position, and timing
4. **`orbFloat`** — 2 large ambient glow orbs that slowly drift across the screen
5. **`shimmerLine`** — A single horizontal shimmer line at 35% height that pulses in and out

### Dark Overlay System
4-layer overlay ensures text remains readable at all times:
- **Primary gradient** — `rgba(8,8,24,0.82)` top/bottom, `0.55` at center
- **Accent color layer** — radial gradient matching each image's color story (teal for aurora, green for forest, violet for cosmos)
- **Top vignette** — 160px fade-to-dark at top
- **Bottom vignette** — 160px fade-to-dark at bottom

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) |
| npm | ≥ 9 | Comes with Node.js |
| Python | ≥ 3.10 | [python.org](https://python.org) |
| pip | Latest | `python -m ensurepip` |

---

## ⚙️ Running the Backend

The Python backend is **optional** — the app works fully without it via Gemini + offline fallback. But running it gives you a local ML model as an additional layer.

**Terminal 1 — Python Backend:**

```bash
# Navigate to the backend folder
cd MindScript-project-main/diary_backend

# Install dependencies (one-time)
pip install fastapi uvicorn joblib scikit-learn pydantic

# Start the server
python3 -m uvicorn server:app --reload --port 8000
```

The backend will start at: **http://localhost:8000**

Available endpoints:
- `POST /analyze-diary` — Accepts `{ "text": "..." }`, returns `{ "score": int, "message": str, "probability": float, "level": str }`

**Health check:**
```bash
curl http://localhost:8000/docs   # Opens FastAPI Swagger UI
```

---

## 💻 Running the Frontend

**Terminal 2 — React/Vite Frontend:**

```bash
# Navigate to the project root
cd MindScript-project-main

# Install dependencies (one-time)
npm install

# Create your environment file (see below)
cp .env.example .env   # Then edit .env with your key

# Start development server
npm run dev
```

The app will open at: **http://localhost:5173**

### Other Commands

```bash
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
npm run lint     # Run ESLint checks
```

---

## 🔑 Environment Variables

Create a `.env` file in `MindScript-project-main/`:

```env
# .env — NEVER commit this file to git
VITE_GEMINI_API_KEY=your_google_gemini_api_key_here
```

Get your free Gemini API key at: [aistudio.google.com](https://aistudio.google.com/apikey)

> ⚠️ The `.env` file is listed in `.gitignore` and will **never** be committed to the repository. Your API key stays local only.

**Note:** Even without a key, the app is functional — it falls through to the custom ML backend and offline keyword engine automatically.

---

## 🗺 Pages & User Flow

```
App Start
    │
    ├── Not Logged In ──► LoginPage (Aurora bg)
    │                         └── Switch to ► RegisterPage (Forest bg)
    │
    └── Logged In ──► DashboardPage (Auto-cycling bg)
                          │
                          ├── [Diary Entry] ──► InputSelectPage ──► DiaryPage
                          │                                              │
                          │                                              └──► Analyzing... ──► ChatPage (Cosmos bg)
                          │
                          ├── [Assessment] ──► InputSelectPage ──► QuizPage (Cosmos bg)
                          │                                              │
                          │                                              └──► Analyzing... ──► ChatPage
                          │
                          └── [Quick Chat] ──────────────────────────────────► ChatPage directly
```

### Page Details

| Route | Component | Background | Purpose |
|---|---|---|---|
| `/` | Redirects to `/dashboard` | — | — |
| Login (state) | `LoginPage` | Aurora 🌌 | Email + password sign in |
| Register (state) | `RegisterPage` | Forest 🌲 | Create new account |
| `/dashboard` | `DashboardPage` | Auto-cycling | Stats, actions, score chart |
| `/input-select` | `InputSelectPage` | Forest 🌲 | Choose diary or quiz |
| `/diary` | `DiaryPage` | Aurora 🌌 | Free-text diary entry |
| `/quiz` | `QuizPage` | Cosmos 🌌 | 14-question assessment |
| `/analyzing` | `LoadingSpinner` | Dark | AI processing indicator |
| `/chat` | `ChatPage` | Cosmos 🌌 | AI conversation + score tracking |

---

## 📊 Assessment Methodology

The 14-question assessment is adapted from two validated clinical instruments:

### PHQ-9 Items (Depression)
Questions 1–9 assess: depressed mood, anhedonia, sleep disturbance, fatigue, appetite changes, self-worth, concentration, psychomotor disturbance, and suicidal ideation.

### GAD-7 Items (Anxiety)
Questions 10–14 assess: excessive worry, uncontrollability of worry, multiple worry domains, difficulty relaxing, and restlessness.

All items scored 0–4 (`Never → Always`). Positive wellbeing questions (1–5) are scored in reverse — higher = better. Negative/symptom questions (6–14) are scored normally — lower = better.

### Score Calculation
```
Positive ratio = sum(positive answers) / (5 × 4)
Negative ratio = sum(negative answers) / (9 × 4)

Wellness Score = round( positiveRatio × 50 + (1 - negativeRatio) × 50 )
// Bounded to [5, 95] to avoid extreme outputs
```

---

## 🤝 Contributing

We welcome contributions! MindScript is built with care and we want to keep that standard.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Follow the existing code style (Tailwind utilities + glass-card component pattern)
4. Never hardcode colors — use the `ms-*` design tokens from `tailwind.config.js`
5. Test your changes on both mobile and desktop
6. Submit a PR with a clear description

### Areas We'd Love Help With
- [ ] Multi-language support (i18n)
- [ ] Push notifications for daily check-ins
- [ ] Export wellness report as PDF
- [ ] Integration with wearable APIs (Apple Health, Google Fit)
- [ ] End-to-end encrypted diary storage (E2EE)
- [ ] Dark/Light theme toggle

---

## 📜 License

MIT License © 2025 MindScript Contributors

---

<div align="center">

*"The greatest wealth is health."*
— Virgil

**Made with 💜 for everyone who needs a safe space.**

</div>
