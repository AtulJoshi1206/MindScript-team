import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import InputSelectPage from './pages/InputSelectPage';
import DiaryPage from './pages/DiaryPage';
import QuizPage from './pages/QuizPage';
import ChatPage from './pages/ChatPage';
import LoadingSpinner from './components/LoadingSpinner';

// Auth utilities
import {
  registerUser, loginUser, setSession, getSession, clearSession,
  getUserScores, saveUserScore,
} from './utils/auth';

// Constants
import { ASSESSMENT_QUESTIONS } from './constants';

// --- Gemini API Configuration ---
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyClsSRbpt_QMoLAxREWjPanhCwhYibefYQ";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

// --- Helper Functions ---
async function fetchGemini(payload, retryCount = 0) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

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

async function fetchCustomModel(content) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch("http://localhost:8000/analyze-diary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: content }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;
    const data = await response.json();
    if (typeof data.score === "number" && typeof data.message === "string") return data;
    return null;
  } catch {
    return null;
  }
}

// --- Offline scoring: keyword-based sentiment analysis ---
function offlineAnalyze(text) {
  const lower = text.toLowerCase();

  const negativeWords = [
    'die', 'death', 'suicide', 'kill', 'hate', 'hopeless', 'worthless', 'depressed',
    'depression', 'anxious', 'anxiety', 'panic', 'scared', 'afraid', 'lonely', 'alone',
    'cry', 'crying', 'sad', 'miserable', 'terrible', 'awful', 'worst', 'pain', 'hurt',
    'suffer', 'broken', 'empty', 'numb', 'tired', 'exhausted', 'stressed', 'angry',
    'furious', 'helpless', 'useless', 'failure', 'failed', 'lost', 'confused', 'overwhelmed',
    'nervous', 'worried', 'insomnia', 'cant sleep', 'no one', 'nobody cares', 'give up',
    'not worth', 'end it', 'self harm', 'cutting', 'overdose',
  ];

  const positiveWords = [
    'happy', 'joy', 'joyful', 'grateful', 'thankful', 'blessed', 'love', 'loved',
    'hopeful', 'hope', 'better', 'good', 'great', 'wonderful', 'amazing', 'excited',
    'peaceful', 'calm', 'relaxed', 'confident', 'strong', 'motivated', 'inspired',
    'cheerful', 'smile', 'laugh', 'fun', 'enjoy', 'proud', 'accomplished', 'success',
    'healthy', 'well', 'fine', 'okay', 'comfortable', 'safe', 'supported', 'friends',
    'family', 'beautiful', 'optimistic', 'progress', 'improve', 'heal', 'recover',
  ];

  const severeWords = ['die', 'death', 'suicide', 'kill', 'end it', 'self harm', 'overdose', 'not worth living'];

  let negCount = 0, posCount = 0, severeCount = 0;
  for (const w of negativeWords) if (lower.includes(w)) negCount++;
  for (const w of positiveWords) if (lower.includes(w)) posCount++;
  for (const w of severeWords) if (lower.includes(w)) severeCount++;

  // Score calculation
  let score;
  if (severeCount >= 2) score = Math.max(5, 15 - severeCount * 5);
  else if (severeCount === 1) score = 20 + posCount * 3;
  else if (negCount === 0 && posCount === 0) score = 55;
  else {
    const ratio = posCount / Math.max(1, posCount + negCount);
    score = Math.round(20 + ratio * 70);
  }
  score = Math.max(5, Math.min(95, score));

  // Generate message
  let message;
  if (score <= 25) {
    message = "I can sense you're going through a really tough time. Please know that you're not alone, and it's okay to ask for help. I'm here for you.";
  } else if (score <= 45) {
    message = "It sounds like things have been difficult lately. I appreciate you sharing this with me. Let's talk about what's been on your mind.";
  } else if (score <= 65) {
    message = "Thank you for opening up. It seems like you're dealing with some mixed feelings. Let's explore what's going on together.";
  } else {
    message = "It's good to hear from you! It sounds like things are going reasonably well. Let's keep this positive momentum going.";
  }

  return { score, message };
}

// Offline chat response based on keywords
function offlineChatReply(userText, userName) {
  const lower = userText.toLowerCase();
  const name = userName || 'there';

  if (lower.match(/\b(die|suicide|kill|end it|self harm)\b/)) {
    return `${name}, I hear you and I take what you're saying seriously. Please reach out to a crisis helpline - you deserve support right now. You matter, and people care about you.`;
  }
  if (lower.match(/\b(sad|depressed|unhappy|miserable|cry)\b/)) {
    return `I'm sorry you're feeling this way, ${name}. Sadness is a natural emotion, and it's brave of you to express it. What do you think triggered these feelings?`;
  }
  if (lower.match(/\b(anxious|anxiety|nervous|scared|worried|panic)\b/)) {
    return `Anxiety can feel really overwhelming, ${name}. Try taking slow, deep breaths right now. What specifically is worrying you the most?`;
  }
  if (lower.match(/\b(angry|hate|furious|frustrated)\b/)) {
    return `It sounds like you're feeling a lot of frustration, ${name}. That's completely valid. What's been making you feel this way?`;
  }
  if (lower.match(/\b(lonely|alone|no one|nobody)\b/)) {
    return `Feeling lonely is really hard, ${name}. I want you to know that I'm here with you right now. Can you tell me more about what's been going on?`;
  }
  if (lower.match(/\b(tired|exhausted|stressed|overwhelmed)\b/)) {
    return `It sounds like you've been carrying a lot, ${name}. Rest is important too. What feels most overwhelming to you right now?`;
  }
  if (lower.match(/\b(happy|good|great|better|wonderful|grateful)\b/)) {
    return `That's really wonderful to hear, ${name}! What's been contributing to these positive feelings? I'd love to know more.`;
  }
  if (lower.match(/\b(thank|thanks)\b/)) {
    return `You're welcome, ${name}. I'm always here whenever you need to talk. How are you feeling now?`;
  }

  return `Thank you for sharing that, ${name}. I'd like to understand better - can you tell me more about what's on your mind?`;
}

// Offline score recalculation from chat history
function offlineRecalculateScore(history, currentScore) {
  const recentUserMessages = history.filter(m => m.role === 'user').slice(-5);
  const combined = recentUserMessages.map(m => m.text).join(' ');
  const analysis = offlineAnalyze(combined);
  // Blend with current score (70% new analysis, 30% previous)
  return Math.round(analysis.score * 0.7 + (currentScore || 50) * 0.3);
}

function extractJsonFromText(text) {
  if (!text || typeof text !== 'string') return null;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    const cleaned = jsonMatch[0].replace(/[\u0000-\u001F]+/g, '').trim();
    try { return JSON.parse(cleaned); } catch { return null; }
  }
}

// --- Main Application Component ---
export default function MindScriptApp() {
  const navigate = useNavigate();

  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [authChecked, setAuthChecked] = useState(false);

  // App state
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

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Check session on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      setCurrentUser(session);
      setScoreHistory(getUserScores(session.email));
    }
    setAuthChecked(true);
  }, []);

  // --- Auth Handlers ---
  const handleLogin = async (email, password) => {
    const result = await loginUser(email, password);
    if (!result.success) throw new Error(result.error);
    setCurrentUser(result.user);
    setSession(result.user);
    setScoreHistory(getUserScores(result.user.email));
    navigate('/dashboard');
  };

  const handleRegister = async (name, email, password) => {
    const result = await registerUser(name, email, password);
    if (!result.success) throw new Error(result.error);
    setCurrentUser(result.user);
    setSession(result.user);
    setScoreHistory([]);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setChatHistory([]);
    setMentalScore(null);
    setScoreHistory([]);
    setQuizAnswers({});
    setInputData({ type: '', content: '' });
    navigate('/');
  };

  // --- Score persistence ---
  const saveScore = (scoreData) => {
    if (!currentUser) return;
    const updated = saveUserScore(currentUser.email, scoreData);
    setScoreHistory(updated);
  };

  // --- DIARY: Gemini scores immediately after diary is published ---
  const handleDiarySubmit = async () => {
    setIsLoading(true);
    navigate('/analyzing');

    try {
      let score = 50;
      let openingMessage = "Thank you for sharing. I'm here to listen. How are you feeling right now?";
      const content = inputData.content;

      // Primary: Gemini for diary analysis
      const prompt = `
        You are MindScript, a compassionate mental health AI assistant.
        Analyze this diary entry from a user:
        "${content}"

        Task:
        1. Determine a Mental Health Score (0-100, where 100 is thriving and 0 is severe distress).
        2. Write a short, empathetic opening message (2-3 sentences).

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
        openingMessage = parsed.message;
      } else {
        // Fallback 2: try custom model
        const customResult = await fetchCustomModel(content);
        if (customResult) {
          score = customResult.score;
          openingMessage = customResult.message;
        } else {
          // Fallback 3: offline keyword analysis
          const offline = offlineAnalyze(content);
          score = offline.score;
          openingMessage = offline.message;
        }
      }

      setMentalScore(score);
      saveScore({ score, type: 'diary-initial' });
      setChatHistory([{ role: 'model', text: openingMessage }]);
      setMsgCountSinceAnalysis(0);
    } catch (err) {
      console.error("Diary analysis error:", err);
      // Even on error, use offline analysis instead of hardcoded 50
      const offline = offlineAnalyze(inputData.content);
      setMentalScore(offline.score);
      saveScore({ score: offline.score, type: 'diary-initial-offline' });
      setChatHistory([{ role: 'model', text: offline.message }]);
    } finally {
      setIsLoading(false);
      navigate('/chat');
    }
  };

  // --- QUIZ: Use custom model primarily, Gemini fallback ---
  const handleQuizSubmit = async () => {
    const formattedAnswers = Object.entries(quizAnswers)
      .map(([index, score]) => `Q: ${ASSESSMENT_QUESTIONS[index]} Answer Score (0-4): ${score}`)
      .join('\n');

    setInputData({ type: 'quiz', content: formattedAnswers });
    setIsLoading(true);
    navigate('/analyzing');

    try {
      let score = 50;
      let openingMessage = "Thank you for completing the assessment. Let's talk about how you're doing.";

      // Try custom model first for quiz
      const customResult = await fetchCustomModel(formattedAnswers);

      if (customResult) {
        score = customResult.score;
        openingMessage = customResult.message;
      } else {
        // Fallback to Gemini
        const prompt = `
          You are MindScript, a mental health AI assistant.
          Analyze this wellness assessment from a user:
          "${formattedAnswers}"

          Task:
          1. Determine a Mental Health Score from 0 (distress) to 100 (thriving).
          2. Write a short, empathetic opening message (2-3 sentences).

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
          openingMessage = parsed.message;
        } else {
          // Fallback 3: offline - calculate from quiz answer scores directly
          const totalScore = Object.values(quizAnswers).reduce((sum, v) => sum + v, 0);
          const maxScore = Object.keys(quizAnswers).length * 4;
          // Questions 0-4 are positive, 5-13 are negative
          const posQs = [0, 1, 2, 3, 4];
          const posSum = posQs.reduce((s, i) => s + (quizAnswers[i] || 0), 0);
          const negSum = totalScore - posSum;
          const posRatio = posSum / (posQs.length * 4);
          const negRatio = negSum / ((Object.keys(quizAnswers).length - posQs.length) * 4);
          score = Math.round(posRatio * 50 + (1 - negRatio) * 50);
          score = Math.max(5, Math.min(95, score));
          openingMessage = score > 60
            ? "Based on your responses, it seems like you're doing reasonably well. Let's chat about how we can keep this positive momentum."
            : "Your responses suggest you may be going through some challenges. I'm here to support you. Let's talk about what you're experiencing.";
        }
      }

      setMentalScore(score);
      saveScore({ score, type: 'quiz-initial' });
      setChatHistory([{ role: 'model', text: openingMessage }]);
      setMsgCountSinceAnalysis(0);
    } catch (err) {
      console.error("Quiz analysis error:", err);
      // Offline quiz scoring from answers
      const totalScore = Object.values(quizAnswers).reduce((sum, v) => sum + v, 0);
      const posQs = [0, 1, 2, 3, 4];
      const posSum = posQs.reduce((s, i) => s + (quizAnswers[i] || 0), 0);
      const negSum = totalScore - posSum;
      const posRatio = posSum / (posQs.length * 4);
      const negRatio = negSum / ((Object.keys(quizAnswers).length - posQs.length) * 4);
      const offScore = Math.max(5, Math.min(95, Math.round(posRatio * 50 + (1 - negRatio) * 50)));
      setMentalScore(offScore);
      saveScore({ score: offScore, type: 'quiz-initial-offline' });
      setChatHistory([{ role: 'model', text: "Thank you for the assessment. Let's talk about how you're feeling." }]);
    } finally {
      setIsLoading(false);
      navigate('/chat');
    }
  };

  // --- CHAT: Gemini primary, custom model fallback if slow/offline ---
  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMsg = { role: 'user', text: currentMessage };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setCurrentMessage('');
    setIsLoading(true);

    const context = newHistory.slice(-10).map(m =>
      `${m.role === 'user' ? 'User' : 'MindScript'}: ${m.text}`
    ).join('\n');

    const prompt = `
      You are MindScript, a supportive AI companion for mental wellness.
      Current Mental Health Score: ${mentalScore ?? 'unknown'} (0-100).
      User's name: ${currentUser?.name || 'Friend'}

      Recent conversation:
      ${context}

      Reply as MindScript. Keep it empathetic, supportive, and concise (2-3 sentences max).
      Address the user by name occasionally.
    `;

    // Try Gemini first
    let botText = null;
    const geminiResult = await fetchGemini({
      contents: [{ parts: [{ text: prompt }] }]
    });

    if (geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text) {
      botText = geminiResult.candidates[0].content.parts[0].text;
    }

    // Fallback 2: custom model if Gemini failed
    if (!botText) {
      const modelResult = await fetchCustomModel(currentMessage);
      if (modelResult?.message) {
        botText = modelResult.message;
      }
    }

    // Fallback 3: offline keyword-based reply
    if (!botText) {
      botText = offlineChatReply(currentMessage, currentUser?.name);
    }

    setChatHistory(prev => [...prev, { role: 'model', text: botText }]);

    const newCount = msgCountSinceAnalysis + 1;
    setMsgCountSinceAnalysis(newCount);

    // Update score after every 3 chat messages
    if (newCount >= 3) {
      recalculateScore([...newHistory, { role: 'model', text: botText }]);
      setMsgCountSinceAnalysis(0);
    }

    setIsLoading(false);
  };

  const recalculateScore = async (history) => {
    const context = history.slice(-10).map(m =>
      `${m.role === 'user' ? 'User' : 'MindScript'}: ${m.text}`
    ).join('\n');

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

    if (result?.candidates?.[0]?.content?.parts?.[0]) {
      const part = result.candidates[0].content.parts[0];
      const parsed = part.json || extractJsonFromText(part.text);
      if (parsed && typeof parsed.score === 'number') {
        setMentalScore(parsed.score);
        saveScore({ score: parsed.score, type: 'chat-update' });
        return;
      }
    }

    // Offline fallback: recalculate from keywords
    const offScore = offlineRecalculateScore(history, mentalScore);
    setMentalScore(offScore);
    saveScore({ score: offScore, type: 'chat-update-offline' });
  };

  const findProfessionals = () => {
    if (!address) return;
    const query = encodeURIComponent(`mental health professionals near ${address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // Quick chat without diary/quiz
  const startQuickChat = () => {
    setChatHistory([{
      role: 'model',
      text: `Hey ${currentUser?.name || 'there'}! I'm MindScript, your wellness companion. How are you feeling today?`
    }]);
    setMentalScore(scoreHistory.length > 0 ? scoreHistory[scoreHistory.length - 1].score : 50);
    setMsgCountSinceAnalysis(0);
    navigate('/chat');
  };

  // --- Loading check ---
  if (!authChecked) return <LoadingSpinner />;

  // --- Not logged in ---
  if (!currentUser) {
    if (authView === 'register') {
      return (
        <RegisterPage
          onRegister={handleRegister}
          onSwitchToLogin={() => setAuthView('login')}
        />
      );
    }
    return (
      <LoginPage
        onLogin={handleLogin}
        onSwitchToRegister={() => setAuthView('register')}
      />
    );
  }

  // --- Logged in: App routes ---
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <DashboardPage
            userName={currentUser.name}
            scoreHistory={scoreHistory}
            onStartDiary={() => { setInputData({ type: 'diary', content: '' }); navigate('/input-select'); }}
            onStartQuiz={() => { setQuizAnswers({}); navigate('/input-select'); }}
            onStartChat={startQuickChat}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/input-select"
        element={
          <InputSelectPage
            onSelectDiary={() => { setInputData({ type: 'diary', content: '' }); navigate('/diary'); }}
            onSelectQuiz={() => { setQuizAnswers({}); navigate('/quiz'); }}
            onBack={() => navigate('/dashboard')}
          />
        }
      />
      <Route
        path="/diary"
        element={
          <DiaryPage
            inputData={inputData}
            setInputData={setInputData}
            handleDiarySubmit={handleDiarySubmit}
            onBack={() => navigate('/input-select')}
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
            onBack={() => navigate('/input-select')}
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
            onBack={() => navigate('/dashboard')}
            userName={currentUser.name}
          />
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
