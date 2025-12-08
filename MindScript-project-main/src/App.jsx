import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import {
  getAuth, signInAnonymously, onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore, collection, addDoc, onSnapshot, serverTimestamp,
} from 'firebase/firestore';

// Import Components
import LoadingSpinner from './components/LoadingSpinner';
import AuthErrorScreen from './components/AuthErrorScreen';
import WelcomePage from './pages/WelcomePage';
import InputSelectPage from './pages/InputSelectPage';
import DiaryPage from './pages/DiaryPage';
import QuizPage from './pages/QuizPage';
import ChatPage from './pages/ChatPage';

// Import Constants
import { ASSESSMENT_QUESTIONS } from './constants';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDcUYmIeNES0mKGpumc3lHYsDYGjFZKskw",
  authDomain: "sathi-app-9a3aa.firebaseapp.com",
  projectId: "sathi-app-9a3aa",
  storageBucket: "sathi-app-9a3aa.firebasestorage.app",
  messagingSenderId: "850525306032",
  appId: "1:850525306032:web:bcae12259a4b1800768f75",
  measurementId: "G-6SJ7NCX6L0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Gemini API Configuration ---
const apiKey = "api_key";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

// --- Helper Functions ---
async function fetchGemini(payload, retryCount = 0) {
  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      if (response.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(res => setTimeout(res, delay));
        return fetchGemini(payload, retryCount + 1);
      }
      throw new Error(`API Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Gemini API fail:", error);
    return null;
  }
}

async function analyzeDiaryWithCustomModel(content) {
  try {
    const response = await fetch("http://localhost:8000/analyze-diary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: content }),
    });

    if (!response.ok) {
      console.error("Custom model API error:", response.status);
      return null;
    }

    const data = await response.json();
    if (typeof data.score === "number" && typeof data.message === "string") {
      return data;
    } else {
      console.error("Unexpected custom model response:", data);
      return null;
    }
  } catch (err) {
    console.error("Custom model call failed:", err);
    return null;
  }
}

// Safely extract JSON substring from text (handles extra text before/after JSON)
function extractJsonFromText(text) {
  if (!text || typeof text !== 'string') return null;
  // match the first {...} block (non-greedy)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    // fallback: try to remove trailing/leading junk and reparse
    const cleaned = jsonMatch[0].replace(/[\u0000-\u001F]+/g, '').trim();
    try { return JSON.parse(cleaned); } catch (e2) { return null; }
  }
}

// --- Main Application Component ---
export default function SathiApp() {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isGuestMode, setIsGuestMode] = useState(false);

  const navigate = useNavigate();

  const [inputData, setInputData] = useState({ type: '', content: '' });
  const [quizAnswers, setQuizAnswers] = useState({});
  const [chatHistory, setChatHistory] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [mentalScore, setMentalScore] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [msgCountSinceAnalysis, setMsgCountSinceAnalysis] = useState(0);
  const [showGraph, setShowGraph] = useState(false);
  const [address, setAddress] = useState('');

  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom when chatHistory changes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // 1. Auth & Data Init
  useEffect(() => {
    let unsubAuth = null;

    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.error("Auth Failed:", e);
        setAuthError(e);
      }
    };
    initAuth();

    unsubAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setAuthError(null);
        // Navigate to welcome after successful auth if user is at root
        if (window.location.pathname === '/') {
          navigate('/welcome');
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      if (typeof unsubAuth === 'function') unsubAuth();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Fetch Score History (Firestore OR Local Storage for Guest)
  useEffect(() => {
    // Guest mode uses localStorage only
    if (isGuestMode) {
      const localData = localStorage.getItem('sathi_scores');
      if (localData) {
        try {
          setScoreHistory(JSON.parse(localData));
        } catch (e) {
          console.error("Failed to parse local score history", e);
          setScoreHistory([]);
        }
      }
      return;
    }

    // Wait until we have a valid user and appId
    if (!user || !user.uid) {
      // clear previous state to avoid stale data
      setScoreHistory([]);
      return;
    }

    if (!appId || appId === '') {
      console.warn('Missing appId - scores not subscribed');
      return;
    }

    // Build collection reference
    const scoresRef = collection(db, 'artifacts', appId, 'users', user.uid, 'scores');

    const unsubscribe = onSnapshot(scoresRef, (snapshot) => {
      try {
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            ...d,
            date: d?.timestamp && d?.timestamp?.seconds
              ? new Date(d.timestamp.seconds * 1000)
              : new Date()
          };
        });
        data.sort((a, b) => a.date - b.date);
        setScoreHistory(data);
      } catch (e) {
        console.error("Error processing snapshot:", e);
      }
    }, (error) => {
      console.error("Firestore error:", error);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user, isGuestMode]);

  const saveScore = async (scoreData) => {
    const newRecord = {
      score: scoreData.score,
      type: scoreData.type,
      timestamp: new Date()
    };

    if (isGuestMode) {
      try {
        const updatedHistory = [...scoreHistory, { ...newRecord, date: newRecord.timestamp }];
        setScoreHistory(updatedHistory);
        localStorage.setItem('sathi_scores', JSON.stringify(updatedHistory));
      } catch (e) {
        console.error("Failed to save local score:", e);
      }
      return;
    }

    if (!user || !user.uid) {
      console.warn("Tried to save score without authenticated user");
      return;
    }

    try {
      await addDoc(
        collection(db, 'artifacts', appId, 'users', user.uid, 'scores'),
        {
          ...newRecord,
          timestamp: serverTimestamp()
        }
      );
    } catch (e) {
      console.error("Failed to save score to Firestore:", e);
    }
  };

  const enableGuestMode = () => {
    setIsGuestMode(true);
    setAuthError(null);
    setUser({ uid: 'guest-user', isAnonymous: true });
    navigate('/welcome');
  };

  // --- Logic Handlers ---
  const handleStart = () => {
    navigate('/input-select');
  };

  const handleQuizSubmit = async () => {
    const formattedAnswers = Object.entries(quizAnswers)
      .map(([index, score]) => `Q: ${ASSESSMENT_QUESTIONS[index]} Answer Score (0-4): ${score}`)
      .join('\n');

    setInputData({ type: 'quiz', content: formattedAnswers });
    await analyzeInitialInput(formattedAnswers, 'quiz');
    navigate('/chat');
  };

  const handleDiarySubmit = async () => {
    await analyzeInitialInput(inputData.content, 'diary');
    navigate('/chat');
  };

  const analyzeInitialInput = async (content, type) => {
  setIsLoading(true);
  navigate('/analyzing');

  try {
    let score = 50;
    let openingMessage =
      "Thank you for sharing. I'm here to listen. How are you feeling right now?";

    if (type === 'diary') {
      // 🟢 1) DIARY → CUSTOM MODEL
      const customResult = await analyzeDiaryWithCustomModel(content);

      if (customResult) {
        score = customResult.score;
        // Yahan tag add kiya: MODEL
        openingMessage = `[MODEL] ${customResult.message}`;
      } else {
        console.warn("Custom model failed, falling back to Gemini for diary.");

        const prompt = `
          You are Sathi, a mental health assistant.
          Analyze this diary input from a user:
          "${content}"

          Task:
          1. Determine a Mental Health Score (0-100).
          2. Write a short, empathetic opening message.

          Output ONLY strict JSON:
          { "score": number, "message": "string" }
        `;

        const result = await fetchGemini({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        });

        const part = result?.candidates?.[0]?.content?.parts?.[0];
        let parsed = null;
        if (part?.json) parsed = part.json;
        else if (part?.text) parsed = extractJsonFromText(part.text);

        if (parsed && typeof parsed.score === 'number' && typeof parsed.message === 'string') {
          score = parsed.score;
          // Yahan tag add kiya: GEMINI-DIARY
          openingMessage = `[GEMINI-DIARY] ${parsed.message}`;
        }
      }
    } else {
      // 🟣 2) QUIZ / ASSESSMENT → GEMINI
      const prompt = `
        You are Sathi, a mental health assistant.
        Analyze this ${type} input from a user:
        "${content}"

        Task:
        1. Determine a Mental Health Score from 0 (distress) to 100 (thriving).
        2. Write a short, empathetic opening message.

        Output ONLY strict JSON:
        { "score": number, "message": "string" }
      `;

      const result = await fetchGemini({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });

      const part = result?.candidates?.[0]?.content?.parts?.[0];
      let parsed = null;
      if (part?.json) parsed = part.json;
      else if (part?.text) parsed = extractJsonFromText(part.text);

      if (parsed && typeof parsed.score === 'number' && typeof parsed.message === 'string') {
        score = parsed.score;
        // Yahan tag add kiya: GEMINI-QUIZ
        openingMessage = `[GEMINI-QUIZ] ${parsed.message}`;
      }
    }

    setMentalScore(score);
    await saveScore({ score, type: 'initial' });
    setChatHistory([{ role: 'model', text: openingMessage }]);
  } catch (err) {
    console.error("Error in analyzeInitialInput:", err);
    setMentalScore(50);
    setChatHistory([{
      role: 'model',
      text: "Thank you for sharing. I'm here to listen. How are you feeling right now?"
    }]);
  } finally {
    setIsLoading(false);
  }
};




  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMsg = { role: 'user', text: currentMessage };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setCurrentMessage('');
    setIsLoading(true);

    const context = newHistory.map(m => `${m.role === 'user' ? 'User' : 'Sathi'}: ${m.text}`).join('\n');

    const prompt = `
      You are Sathi, a supportive AI companion.
      Current Mental Health Score: ${mentalScore ?? 'unknown'} (0-100).
      Chat History:
      ${context}
      User: ${userMsg.text}

      Reply as Sathi. Keep it empathetic, supportive, and concise (max 2-3 sentences).
    `;

    const result = await fetchGemini({
      contents: [{ parts: [{ text: prompt }] }]
    });

    if (result && result.candidates && result.candidates[0]?.content) {
      const botText = result.candidates[0].content.parts[0]?.text || '';
      setChatHistory(prev => [...prev, { role: 'model', text: botText }]);

      const newCount = msgCountSinceAnalysis + 1;
      setMsgCountSinceAnalysis(newCount);

      if (newCount >= 5) {
        // recalc score based on last few messages
        recalculateScore([...newHistory, { role: 'model', text: botText }]);
        setMsgCountSinceAnalysis(0);
      }
    } else {
      console.warn("No Gemini reply for message; adding fallback.");
      setChatHistory(prev => [...prev, { role: 'model', text: "Thanks for sharing — can you tell me a bit more?" }]);
    }

    setIsLoading(false);
  };

  const recalculateScore = async (history) => {
    const context = history.slice(-10).map(m => `${m.role === 'user' ? 'User' : 'Sathi'}: ${m.text}`).join('\n');
    const prompt = `
      Analyze the recent conversation context below.
      Re-evaluate the user's Mental Health Score (0-100).
      Return ONLY valid JSON: { "score": number }

      Context:
      ${context}
    `;

    const result = await fetchGemini({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    if (result && result.candidates && result.candidates[0]?.content) {
      const responseText = result.candidates[0].content.parts[0]?.text;
      const parsed = extractJsonFromText(responseText);
      if (parsed && typeof parsed.score === 'number') {
        setMentalScore(parsed.score);
        await saveScore({ score: parsed.score, type: 'update' });
      } else {
        console.warn("Could not parse recalculation JSON");
      }
    } else {
      console.warn("No Gemini result for recalculation");
    }
  };

  const findProfessionals = () => {
    if (!address) return;
    const query = encodeURIComponent(`mental health professionals near ${address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // Error State
  if (authError) {
    return <AuthErrorScreen error={authError} onGuestMode={enableGuestMode} />;
  }

  // Loading State when user is not authenticated and not in guest mode
  if (!user && !isGuestMode) return <LoadingSpinner />;

  return (
    <Routes>
      <Route path="/" element={<WelcomePage handleStart={handleStart} isGuestMode={isGuestMode} />} />
      <Route path="/welcome" element={<WelcomePage handleStart={handleStart} isGuestMode={isGuestMode} />} />
      <Route path="/input-select" element={<InputSelectPage setView={navigate} />} />
      <Route
        path="/diary"
        element={
          <DiaryPage
            inputData={inputData}
            setInputData={setInputData}
            handleDiarySubmit={handleDiarySubmit}
            setView={navigate}
          />
        }
      />
      <Route
        path="/quiz"
        element={
          <QuizPage
            quizAnswers={quizAnswers}
            setQuizAnswers={setQuizAnswers}
            handleQuizSubmit={handleQuizSubmit}
          />
        }
      />
      <Route path="/analyzing" element={<LoadingSpinner />} />
      <Route
        path="/chat"
        element={
          <ChatPage
            chatHistory={chatHistory}
            currentMessage={currentMessage}
            setCurrentMessage={setCurrentMessage}
            handleSendMessage={handleSendMessage}
            isLoading={isLoading}
            mentalScore={mentalScore}
            showGraph={showGraph}
            setShowGraph={setShowGraph}
            scoreHistory={scoreHistory}
            address={address}
            setAddress={setAddress}
            findProfessionals={findProfessionals}
            chatEndRef={chatEndRef}
          />
        }
      />
    </Routes>
  );
}
