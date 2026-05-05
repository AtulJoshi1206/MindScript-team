import React, { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  Activity, Send, Smile, Frown, Sparkles, RefreshCw, X, ArrowLeft, Heart, Shield,
  Mic, MicOff, Volume2, VolumeX, Loader2
} from "lucide-react";
import MindfulBackground from '../components/MindfulBackground';

const ENCOURAGEMENTS = [
  "You're doing great by talking about this",
  "Every conversation is a step forward",
  "Your feelings matter",
  "It takes courage to open up",
  "You're not alone in this",
];

const ChatPage = ({
  chatHistory,
  currentMessage,
  setCurrentMessage,
  handleSendMessage,
  isLoading,
  isRecording,
  isVoiceProcessing,
  isSpeaking,
  autoSpeakReplies,
  onToggleVoiceRecording,
  onToggleAutoSpeak,
  mentalScore,
  showGraph,
  setShowGraph,
  scoreHistory,
  address,
  setAddress,
  findProfessionals,
  chatEndRef,
  onBack,
  userName,
}) => {
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatEndRef]);

  const [canRenderChart, setCanRenderChart] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setCanRenderChart(showGraph));
    return () => cancelAnimationFrame(frame);
  }, [showGraph]);

  // Rotating encouragement for the input area
  const [encourageIdx, setEncourageIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setEncourageIdx(p => (p + 1) % ENCOURAGEMENTS.length), 6000);
    return () => clearInterval(t);
  }, []);

  const getScoreColor = (s) => {
    if (s > 0.7) return "text-emerald-400";
    if (s > 0.4) return "text-ms-accent";
    return "text-ms-secondary";
  };

  const getScoreDot = (s) => {
    if (s > 0.7) return "bg-emerald-400";
    if (s > 0.4) return "bg-ms-accent";
    return "bg-ms-secondary";
  };

  const getScoreLabel = (s) => {
    if (s > 0.7) return "Doing Well";
    if (s > 0.4) return "Moderate";
    return "Needs Support";
  };

  const formatScore = (s) => Number(s).toFixed(2);

  return (
    <div className="flex flex-col h-screen animate-fade-in relative">
      <MindfulBackground variant="cosmos" />

      {/* Header */}
      <header className="glass-card border-0 border-b border-white/5 rounded-none p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="text-ms-muted hover:text-ms-primary-light transition-colors mr-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-glow-pulse"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)' }}>
            <Sparkles className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <div>
            <h1 className="font-bold text-ms-text text-lg flex items-center gap-1.5">
              MindScript
              {userName && <span className="text-ms-muted font-normal text-sm hidden sm:inline">for {userName}</span>}
            </h1>
            {mentalScore !== null && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${getScoreDot(mentalScore)} animate-pulse`}></span>
                <span className={`text-xs ${getScoreColor(mentalScore)}`}>
                  {getScoreLabel(mentalScore)}
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowGraph(!showGraph)}
          className="p-2.5 rounded-xl hover:bg-white/5 text-ms-primary-light transition-all relative"
        >
          <Activity size={20} />
          {scoreHistory.length >= 3 && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-ms-accent rounded-full animate-bounce-slow"></span>
          )}
        </button>
      </header>

      {/* Graph Modal */}
      {showGraph && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowGraph(false)}>
          <div className="glass-card rounded-2xl w-full max-w-xl p-6 sm:p-8 animate-pop-in"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-ms-primary-light to-ms-teal bg-clip-text text-transparent">
                Your Mental Curve
              </h3>
              <button onClick={() => setShowGraph(false)} className="text-ms-muted hover:text-ms-secondary transition-colors">
                <X size={22} />
              </button>
            </div>

            {scoreHistory.length > 1 ? (
              <div className="h-64 w-full" style={{ minWidth: 0, minHeight: 0 }}>
                {canRenderChart && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={scoreHistory.map((s) => ({
                        ...s,
                        date: new Date(s.timestamp).getTime()
                      }))}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        minTickGap={30}
                        tick={{ fill: '#8888aa', fontSize: 12 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                        tickLine={false}
                      />
                      <YAxis domain={[0, 1]} tick={{ fill: '#8888aa', fontSize: 12 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} tickLine={false} />
                      <Tooltip
                        labelFormatter={(l) => new Date(l).toLocaleString()}
                        contentStyle={{
                          borderRadius: '12px', border: 'none',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                          background: 'rgba(26,26,62,0.95)', color: '#e8e8f0'
                        }}
                      />
                      <Line type="monotone" dataKey="score" stroke="#a78bfa" strokeWidth={3}
                        dot={{ r: 4, fill: '#a78bfa', strokeWidth: 2, stroke: '#0a0a1a' }}
                        activeDot={{ r: 6, fill: '#a78bfa', stroke: '#fff' }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
                <p className="text-center text-xs text-ms-muted mt-3">Score trajectory over time</p>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-ms-muted rounded-xl flex-col gap-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <Activity className="w-6 h-6 text-ms-muted/40" />
                <p>Not enough data points yet. Keep chatting!</p>
              </div>
            )}

            {/* Recommendations */}
            <div className="mt-6 pt-6 border-t border-white/5">
              {mentalScore >= 0.7 ? (
                <div className="rounded-xl p-4 text-center animate-pop-in" style={{ background: 'rgba(16,185,129,0.08)' }}>
                  <Smile className="w-8 h-8 text-emerald-400 mx-auto mb-2 animate-bounce-small" />
                  <p className="text-ms-text text-sm font-medium">"Happiness is not something ready made. It comes from your own actions."</p>
                  <p className="text-ms-muted text-xs mt-1">- Dalai Lama</p>
                </div>
              ) : mentalScore <= 0.4 ? (
                <div className="rounded-xl p-4 animate-pop-in" style={{ background: 'rgba(244,63,94,0.08)' }}>
                  <div className="flex items-center gap-2 mb-2 justify-center text-ms-secondary">
                    <Shield className="w-5 h-5" />
                    <span className="font-semibold text-sm">Professional Support</span>
                  </div>
                  <p className="text-ms-muted text-sm text-center mb-3">
                    You don't have to face this alone. Consider reaching out to a professional nearby.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter your city"
                      className="input-field flex-1 text-sm py-2"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                    <button onClick={findProfessionals}
                      className="px-4 py-2 rounded-xl text-white text-sm font-medium transition-all hover:scale-[1.02]"
                      style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #f59e0b 100%)' }}>
                      Find
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl p-4 text-center animate-pop-in" style={{ background: 'rgba(124,58,237,0.08)' }}>
                  <RefreshCw className="w-6 h-6 text-ms-primary-light mx-auto mb-2 animate-spin-slow" />
                  <p className="text-ms-text text-sm font-medium">"Keep going. Everything you need will come at the perfect time."</p>
                  <p className="text-ms-muted text-xs mt-1">You're making progress</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-4 space-y-3">
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <Heart className="w-10 h-10 text-ms-primary-light/30 mb-3 animate-float" />
            <p className="text-ms-muted text-sm">Start a conversation. I'm here to listen.</p>
          </div>
        )}

        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            style={{ animationDelay: `${idx * 0.03}s` }}
          >
            {msg.role !== "user" && (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center mr-2 mt-1 flex-shrink-0"
                style={{ background: 'rgba(124,58,237,0.15)' }}>
                <Sparkles className="w-3.5 h-3.5 text-ms-primary-light" />
              </div>
            )}
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                  ? "text-white rounded-br-sm"
                  : "glass-card text-ms-text rounded-bl-sm"
                }`}
              style={msg.role === "user"
                ? { background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)' }
                : undefined
              }
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center mr-2 mt-1 flex-shrink-0"
              style={{ background: 'rgba(124,58,237,0.15)' }}>
              <Sparkles className="w-3.5 h-3.5 text-ms-primary-light animate-spin-slow" />
            </div>
            <div className="glass-card px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
              <span className="w-2 h-2 bg-ms-primary-light rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
              <span className="w-2 h-2 bg-ms-primary-light rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></span>
              <span className="w-2 h-2 bg-ms-primary-light rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 glass-card border-0 border-t border-white/5 rounded-none">
        {/* Encouragement text */}
        <p className="text-center text-ms-muted/40 text-[11px] mb-2 animate-fade-in" key={encourageIdx}>
          {ENCOURAGEMENTS[encourageIdx]}
        </p>
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <button
            onClick={onToggleVoiceRecording}
            disabled={isLoading || isVoiceProcessing}
            className={`p-3 rounded-xl text-white transition-all duration-300 disabled:opacity-30 hover:scale-[1.05] active:scale-95 ${isRecording ? "animate-pulse" : ""}`}
            style={{ background: isRecording ? 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' : 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)' }}
            title={isRecording ? "Stop recording" : "Record voice"}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button
            onClick={onToggleAutoSpeak}
            disabled={isLoading || isVoiceProcessing}
            className="p-3 rounded-xl text-white transition-all duration-300 disabled:opacity-30 hover:scale-[1.05] active:scale-95"
            style={{ background: autoSpeakReplies ? 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)' : 'linear-gradient(135deg, #334155 0%, #475569 100%)' }}
            title={autoSpeakReplies ? "Turn off spoken replies" : "Turn on spoken replies"}
          >
            {autoSpeakReplies ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
            placeholder="Type your message or use voice..."
            className="input-field flex-1 py-3"
          />
          <button
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || isLoading}
            className="p-3 rounded-xl text-white transition-all duration-300 disabled:opacity-30 hover:scale-[1.05] active:scale-95"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)' }}
            >
            <Send size={20} />
          </button>
        </div>
        {(isRecording || isVoiceProcessing || isSpeaking) && (
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-ms-muted">
            <Loader2 className={`w-3.5 h-3.5 ${isRecording || isVoiceProcessing ? "animate-spin" : ""}`} />
            <span>
              {isRecording && "Recording voice... tap mic to stop"}
              {!isRecording && isVoiceProcessing && "Transcribing voice..."}
              {!isRecording && !isVoiceProcessing && isSpeaking && "Speaking reply..."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
