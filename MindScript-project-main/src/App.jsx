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
  getUserScores, saveUserScore, getUserConversation, saveUserConversation,
  migrateToBackend
} from './utils/auth';

// Constants
import { ASSESSMENT_QUESTIONS } from './constants';

// --- Helper Functions ---
async function fetchLocalModel(content) {
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

async function fetchLocalChatReply(message, history, mentalScore, userName) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: history.slice(-8),
        mental_score: mentalScore ?? null,
        user_name: userName ?? null,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;
    const data = await response.json();
    if (typeof data.reply === "string" && data.reply.trim()) return data.reply.trim();
    return null;
  } catch {
    return null;
  }
}

function calculateQuizScore(quizAnswers) {
  const values = Object.values(quizAnswers)
    .map(Number)
    .filter((value) => !Number.isNaN(value));

  if (values.length === 0) return 0.5;

  const total = values.reduce((sum, value) => sum + value, 0);
  const maxScore = values.length * 4;
  return Number((total / maxScore).toFixed(2));
}

function buildQuizSupportiveMessage(score) {
  if (score >= 0.75) {
    return "Your responses show a strong sense of wellbeing. Let's keep noticing what is working and what feels supportive.";
  }

  if (score >= 0.45) {
    return "Your responses are mixed, and that is okay. We can explore what feels manageable and what feels harder right now.";
  }

  return "It sounds like this has been a difficult time. I'm here with you, and we can take it one step at a time.";
}

async function transcribeVoiceBlob(blob) {
  try {
    const formData = new FormData();
    const extension = blob.type.includes('mp4') ? 'm4a' : 'webm';
    formData.append('file', blob, `mindscript-voice.${extension}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const response = await fetch("http://localhost:8000/transcribe-audio", {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;
    const data = await response.json();
    if (typeof data.text === "string") return data;
    return null;
  } catch {
    return null;
  }
}

async function fetchSpeechAudio(text) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("http://localhost:8000/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;
    return await response.blob();
  } catch {
    return null;
  }
}

const HINDI_DEVANAGARI_RE = /[\u0900-\u097F]/;
const ROMAN_HINDI_RE = /\b(main|mai|mein|mujhe|mera|meri|mere|tum|tumhe|aap|apko|kaise|kaisa|kaisi|kya|kyu|kyun|nahi|nahin|haan|hoon|hun|hai|kar|lagta|lagti|achha|accha|theek|khush|dukhi|pareshan|darr|dar|zindagi|kaam|ghar|dost|baat|batao|samajh|bas|yaar)\b/gi;

function detectMessageLanguage(text) {
  if (HINDI_DEVANAGARI_RE.test(text)) return 'hi';
  const matches = text.match(ROMAN_HINDI_RE) || [];
  const words = text.match(/\b[\w']+\b/g) || [];
  return matches.length >= 2 || (matches.length === 1 && words.length <= 8) ? 'hi' : 'en';
}

function usesDevanagari(text) {
  return HINDI_DEVANAGARI_RE.test(text);
}

function buildOfflineChatReply(message, history) {
  const lower = message.toLowerCase();
  const language = detectMessageLanguage(message);
  const isDevanagari = usesDevanagari(message);
  
  // Detect severity - self-harm, suicide, severe distress
  const severityEnglish = /\b(hurt|harm|kill|suicide|die|death|end it|cut|blade|rope|overdose|disappear)\b/.test(lower);
  const severityDevanagari = /(चोट|नुकसान|मौत|मर|आत्महत्या|खुद को|ख़त्म|बस|ठीक नहीं)/.test(message);
  const isSevere = severityEnglish || severityDevanagari;
  
  // Detect emotional tone - check BOTH English Roman AND Devanagari patterns
  const positiveEnglish = /\b(happy|good|great|better|khush|achha|accha|proud|improve|strength|strong|well|wonderful)\b/.test(lower);
  const positiveDevanagari = /(खुश|अच्छा|बेहतर|गर्व|कामयाब|सुकून|बहुत अच्छा|प्रसन्न|शानदार|बेहतरीन|आशान्वित|खुश)/.test(message);
  const positive = !isSevere && (positiveEnglish || positiveDevanagari);
  
  const distressedEnglish = /\b(sad|down|tired|anxious|panic|alone|empty|stress|stressed|depress|upset|dukhi|pareshan|tension|udaas|akela|dar|darr|helpless|hopeless|fail|useless|numb|hurt|pain|miserable|overwhelmed|broken)\b/.test(lower);
  const distressedDevanagari = /(उदास|दुख|परेशान|तनाव|डर|अकेला|थक|घबर|निराश|असहाय|हताश|टूटा|दर्द|रो|रुलाई|चिंता|बेचैन|दुःख)/.test(message);
  const distressed = (positiveEnglish || positiveDevanagari) ? false : (distressedEnglish || distressedDevanagari);
  
  // Build options based on language, tone, and severity
  let options = [];
  
  if (isSevere) {
    // Severe distress - prioritize safety and professional help
    if (language === 'hi' && isDevanagari) {
      options = [
        "मेरी चिंता है तुम्हारे बारे में। क्या तुम किसी विश्वसनीय व्यक्ति को बता सकते हो? कृपया राष्ट्रीय आत्महत्या निवारण हेल्पलाइन को कॉल करो - 1071।",
        "तुम महत्वपूर्ण हो। यह भावना गुजर जाएगी, लेकिन अभी तुम्हें मदद चाहिए। क्या तुम किसी डॉक्टर से बात कर सकते हो?",
      ];
    } else if (language === 'hi') {
      options = [
        "Meri chinta hai tumhare baare mein. Kya tum kisi vishwasaneeya vyakti ko bata sakte ho? Rashtriya Aatmahatya Navaaran Helpline: 1071",
        "Tum important ho. Yeh feeling theek ho jayega, lekin abhi tumhe madad chahiye. Doctor se baat kar sakte ho?",
      ];
    } else {
      options = [
        "I'm really concerned about you. Please reach out to someone you trust or call a crisis helpline - National Suicide Prevention Lifeline: 988 (US) or text 'HELLO' to 741741.",
        "You matter. This feeling will pass, but you need support right now. Please talk to a mental health professional or someone you trust.",
      ];
    }
  } else if (language === 'hi' && isDevanagari) {
    // Hindi Devanagari responses
    if (positive) {
      options = [
        "यह सुनकर बहुत खुशी हुई। इस अच्छाई को कैसे ज़्यादा दिनों तक बनाए रख सकते हो?",
        "बहुत अच्छी बात है। ऐसा क्या हुआ जिससे ये सकारात्मक परिवर्तन आया?",
        "तुम्हें गर्व होना चाहिए। तुम्हारे हिसाब से इसमें सबसे ज़रूरी चीज़ क्या थी?",
        "बेहतरीन। क्या तुम इस भावना को अभी और भी गहराई से महसूस कर सकते हो?",
      ];
    } else if (distressed) {
      options = [
        "यह काफ़ी भारी लग रहा है। तुम अभी अकेले नहीं हो। सबसे तकलीफ़ देह बात कौन सी है?",
        "समझ रही हूँ। यह भावना कब से तुम्हारे साथ है? क्या किसी ख़ास घटना के बाद शुरू हुआ?",
        "मुझे बताओ, इस समय तुम्हारे अंदर कौन सी भावना सबसे ज़्यादा मजबूत है? दर्द, डर, या कुछ और?",
        "ठीक है, हम इसे धीरे-धीरे समझते हैं। क्या तुम एक छोटी सी बात साझा कर सकते हो जो सबसे ज़्यादा दुख दे रही है?",
      ];
    } else {
      options = [
        "मैं समझ रही हूँ। तुम्हारे लिए इस बात का सबसे ज़्यादा मायने क्या है?",
        "ठीक है, मैं सुन रही हूँ। बताओ, तुम्हारे अंदर अभी कौन सी भावना चल रही है?",
        "मुझे थोड़ा और जानने दो। यह कब से चल रहा है और इसका तुम पर क्या असर हो रहा है?",
        "हाँ, मैं यहाँ हूँ। इस समय तुम्हें क्या सबसे ज़्यादा परेशान कर रहा है?",
      ];
    }
  } else if (language === 'hi') {
    // Hindi Roman responses
    if (positive) {
      options = [
        "Yeh sunke bahut khushi hui. Is achhaye ko kaise zyada dinon tak ban rakhe rakh sakte ho?",
        "Bahut achi baat hai. Aisa kya hua jisse ye positive badlav aaya?",
        "Tumhe garv hona chahiye. Tumhare hisaab se sabse important kya tha?",
        "Behatreen. Isko aur bhi gahari nazar se dekh sakte ho?",
      ];
    } else if (distressed) {
      options = [
        "Yeh kaafi heavy lag raha hai. Tum akele nahi ho. Sabse bada dard kaun sa hai?",
        "Samajh rahi hoon. Yeh feeling kab se? Kisi specific event ke baad shuru hua?",
        "Mujhe batao, sabse strong emotion kaun sa hai? Dard, dar, ya stress?",
        "Theek hai, dheere dheere samjhte hain. Sabse zyada dukh dene wali baat kya hai?",
      ];
    } else {
      options = [
        "Samajh rahi hoon. Is baat ka tumhare liye sabse zyada matlab kya hai?",
        "Theek hai, mein sun rahi hoon. Batao, tumhare andar kaun si bhavna chal rahi hai?",
        "Mujhe thoda or janne do. Yeh kab se chal raha hai aur iska tumpar kya asar pad raha hai?",
        "Haan, main yahan hoon. Abhi tumhe kya sabse zyada pareshan kar raha hai?",
      ];
    }
  } else {
    // English responses
    if (positive) {
      options = [
        "That's wonderful. What helped you feel this way today?",
        "I'm so glad you're noticing this positive change. How can you hold onto this feeling?",
        "That sounds like real progress. What part of it are you most proud of?",
        "That's beautiful. What would help you feel this way more often?",
      ];
    } else if (distressed) {
      options = [
        "That sounds really hard. You're not alone in this. What hurts the most right now?",
        "I hear the pain in what you're sharing. When did this start feeling so heavy?",
        "Take a breath. What's the one thing that feels most overwhelming for you?",
        "I'm listening and I care. Can you tell me the hardest part of what you're carrying?",
        "It sounds like you're dealing with a lot. What emotion is strongest right now—sadness, fear, stress, or something else?",
      ];
    } else {
      options = [
        "I'm here and listening. What matters most to you about what you just shared?",
        "Tell me more. How is that affecting you?",
        "I'm listening. When did this feeling start?",
        "What's the core of what you're experiencing right now?",
        "Help me understand. What's the biggest challenge for you in this situation?",
      ];
    }
  }
  
  // Rotate through options to avoid repetition
  const recentReplies = new Set(history.slice(-10).filter(m => m.role === 'model').map(m => m.text));
  const seed = [...message].reduce((sum, char) => sum + char.charCodeAt(0), history.length);
  const randomIndex = seed % options.length;
  
  return options.slice(randomIndex).concat(options.slice(0, randomIndex))
    .find(reply => !recentReplies.has(reply)) || options[randomIndex];
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
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeakReplies, setAutoSpeakReplies] = useState(true);

  const chatEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const voiceChunksRef = useRef([]);
  const audioPlayerRef = useRef(null);
  const audioUrlRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Check session on mount
  useEffect(() => {
    async function init() {
      // 1. Sync any existing local data to the backend file system
      await migrateToBackend();

      // 2. Load session
      const session = getSession();
      if (session) {
        setCurrentUser(session);
        // 3. Load user data from backend
        const scores = await getUserScores(session.email);
        setScoreHistory(scores);
        const history = await getUserConversation(session.email);
        setChatHistory(history);
      }
      setAuthChecked(true);
    }
    init();
  }, []);

  // --- Auth Handlers ---
  const handleLogin = async (email, password) => {
    const result = await loginUser(email, password);
    if (!result.success) throw new Error(result.error);
    setCurrentUser(result.user);
    setSession(result.user);
    const scores = await getUserScores(result.user.email);
    setScoreHistory(scores);
    const history = await getUserConversation(result.user.email);
    setChatHistory(history);
    navigate('/dashboard');
  };

  const handleRegister = async (name, email, password) => {
    const result = await registerUser(name, email, password);
    if (!result.success) throw new Error(result.error);
    setCurrentUser(result.user);
    setSession(result.user);
    setScoreHistory([]);
    setChatHistory([]);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    stopVoiceRecording();
    stopPlayingAudio();
    clearSession();
    setCurrentUser(null);
    setChatHistory([]);
    setMentalScore(null);
    setScoreHistory([]);
    setQuizAnswers({});
    setInputData({ type: '', content: '' });
    setIsRecording(false);
    setIsVoiceProcessing(false);
    setIsSpeaking(false);
    setAutoSpeakReplies(true);
    navigate('/');
  };

  // --- Score persistence ---
  const saveScore = async (scoreData) => {
    if (!currentUser) return;
    const updated = await saveUserScore(currentUser.email, scoreData);
    setScoreHistory(updated);
  };

  const persistChatHistory = async (history) => {
    setChatHistory(history);
    if (currentUser?.email) {
      await saveUserConversation(currentUser.email, history);
    }
  };

  const stopPlayingAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = '';
      audioPlayerRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  };

  const speakReply = async (text) => {
    if (!autoSpeakReplies || !text?.trim()) return;

    setIsSpeaking(true);
    try {
      const audioBlob = await fetchSpeechAudio(text);
      if (!audioBlob) {
        setIsSpeaking(false);
        return;
      }

      stopPlayingAudio();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (audioUrlRef.current === audioUrl) {
          audioUrlRef.current = null;
        }
        if (audioPlayerRef.current === audio) {
          audioPlayerRef.current = null;
        }
        setIsSpeaking(false);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        if (audioUrlRef.current === audioUrl) {
          audioUrlRef.current = null;
        }
        if (audioPlayerRef.current === audio) {
          audioPlayerRef.current = null;
        }
        setIsSpeaking(false);
      };
      await audio.play();
    } catch (error) {
      console.error("Speech playback error:", error);
      setIsSpeaking(false);
    }
  };

  const sendChatMessage = async (messageText, options = {}) => {
    const cleanText = messageText.trim();
    if (!cleanText) return null;

    const userMsg = {
      role: 'user',
      text: cleanText,
      source: options.source || 'text',
    };
    const newHistory = [...chatHistory, userMsg];
    await persistChatHistory(newHistory);
    setCurrentMessage('');
    setIsLoading(true);

    const botText = await fetchLocalChatReply(
      cleanText,
      newHistory,
      mentalScore,
      currentUser?.name
    ) || buildOfflineChatReply(cleanText, newHistory);

    const updatedHistory = [...newHistory, { role: 'model', text: botText }];
    await persistChatHistory(updatedHistory);

    const newCount = msgCountSinceAnalysis + 1;
    setMsgCountSinceAnalysis(newCount);

    if (newCount >= 3) {
      recalculateScore(updatedHistory);
      setMsgCountSinceAnalysis(0);
    }

    setIsLoading(false);
    if (options.source === 'voice') {
      void speakReply(botText);
    }
    return botText;
  };

  const cleanupVoiceStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
  };

  const handleVoiceTranscript = async (blob) => {
    setIsVoiceProcessing(true);
    try {
      const transcript = await transcribeVoiceBlob(blob);
      const spokenText = transcript?.text?.trim();
      if (!spokenText) {
        await persistChatHistory([
          ...chatHistory,
          {
            role: 'model',
            text: "I couldn't hear that clearly. Please try again a little closer to the mic.",
          },
        ]);
        throw new Error("No speech detected");
      }
      await sendChatMessage(spokenText, { source: 'voice' });
    } finally {
      setIsVoiceProcessing(false);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const startVoiceRecording = async () => {
    if (isLoading || isVoiceProcessing || isRecording) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      console.error("Voice recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
      ];
      const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      voiceChunksRef.current = [];
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          voiceChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(voiceChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        voiceChunksRef.current = [];
        cleanupVoiceStream();
        setIsRecording(false);
        try {
          await handleVoiceTranscript(blob);
        } catch (error) {
          console.error("Voice transcription error:", error);
        }
      };

      recorder.start();
    } catch (error) {
      console.error("Voice capture error:", error);
      cleanupVoiceStream();
      setIsRecording(false);
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      void startVoiceRecording();
    }
  };

  const toggleAutoSpeakReplies = () => {
    setAutoSpeakReplies(prev => {
      const next = !prev;
      if (!next) {
        stopPlayingAudio();
      }
      return next;
    });
  };

  // --- DIARY: local model scores immediately after diary is published ---
  const handleDiarySubmit = async () => {
    setIsLoading(true);
    navigate('/analyzing');

    try {
      let score = 0.5;
      let openingMessage = "Thank you for sharing. I'm here to listen. How are you feeling right now?";
      const content = inputData.content;

      const localResult = await fetchLocalModel(content);
      if (localResult) {
        score = localResult.score;
        openingMessage = localResult.message;
      } else {
        throw new Error("Local scoring backend unavailable");
      }
      
      setMentalScore(score);
      await saveScore({ score, type: 'diary-initial' });
      await persistChatHistory([{ role: 'model', text: openingMessage }]);
      setMsgCountSinceAnalysis(0);
    } catch (err) {
      console.error("Diary analysis error:", err);
      const fallbackMessage = "I couldn't analyze that diary entry locally right now. Please try again once the backend is running.";
      setMentalScore(0.5);
      await saveScore({ score: 0.5, type: 'diary-initial-offline' });
      await persistChatHistory([{ role: 'model', text: fallbackMessage }]);
    } finally {
      setIsLoading(false);
      navigate('/chat');
    }
  };

  // --- QUIZ: Use local model for scoring ---
  const handleQuizSubmit = async (questionsUsed = null) => {
    const questionsToUse = questionsUsed || ASSESSMENT_QUESTIONS;
    const score = calculateQuizScore(quizAnswers);
    const openingMessage = buildQuizSupportiveMessage(score);

    setInputData({
      type: 'quiz',
      content: JSON.stringify({
        questions: questionsToUse,
        answers: quizAnswers,
        score,
      }),
    });
    setIsLoading(true);
    navigate('/analyzing');

    try {
      setMentalScore(score);
      await saveScore({ score, type: 'quiz-initial' });
      await persistChatHistory([{ role: 'model', text: openingMessage }]);
      setMsgCountSinceAnalysis(0);
    } catch (err) {
      console.error('Quiz scoring error:', err);
      const fallbackScore = 0.5;
      setMentalScore(fallbackScore);
      await saveScore({ score: fallbackScore, type: 'quiz-initial-offline' });
      await persistChatHistory([{ role: 'model', text: "I couldn't process that assessment right now. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
      navigate('/chat');
    }
  };

  // --- CHAT: local LLM replies, local model for score updates ---
  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    await sendChatMessage(currentMessage, { source: 'text' });
  };

  const recalculateScore = async (history) => {
    const context = history.slice(-10).map(m =>
      `${m.role === 'user' ? 'User' : 'MindScript'}: ${m.text}`
    ).join('\n');
    try {
      const localResult = await fetchLocalModel(context);
      if (localResult && typeof localResult.score === 'number') {
        setMentalScore(localResult.score);
        await saveScore({ score: localResult.score, type: 'chat-update' });
      }
    } catch (error) {
      console.error("Chat score recalculation error:", error);
    }
  };

  const findProfessionals = () => {
    if (!address) return;
    const query = encodeURIComponent(`mental health professionals near ${address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // Quick chat without diary/quiz
  const startQuickChat = async () => {
    await persistChatHistory([{
      role: 'model',
      text: `Hey ${currentUser?.name || 'there'}! I'm MindScript, your wellness companion. How are you feeling today?`
    }]);
    setMentalScore(scoreHistory.length > 0 ? scoreHistory[scoreHistory.length - 1].score : 0.5);
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
            onStartDiary={() => { setInputData({ type: 'diary', content: '' }); navigate('/diary'); }}
            onStartQuiz={() => { setQuizAnswers({}); navigate('/quiz'); }}
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
            isRecording={isRecording}
            isVoiceProcessing={isVoiceProcessing}
            isSpeaking={isSpeaking}
            autoSpeakReplies={autoSpeakReplies}
            onToggleVoiceRecording={toggleVoiceRecording}
            onToggleAutoSpeak={toggleAutoSpeakReplies}
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
