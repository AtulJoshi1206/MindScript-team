import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  BookOpen, Activity, MessageCircle, TrendingUp, LogOut, Sparkles, Heart, Quote,
  Wind, Zap, Target, Smile
} from 'lucide-react';
import MindfulBackground from '../components/MindfulBackground';
import ScrollingFooter from '../components/ScrollingFooter';
import { MOOD_QUOTES } from '../constants';

const DashboardPage = ({ userName, scoreHistory, onStartDiary, onStartQuiz, onStartChat, onLogout }) => {
  const latestScore = scoreHistory.length > 0 ? scoreHistory[scoreHistory.length - 1].score : null;
  const isFirstTime = scoreHistory.length === 0;

  // Rotating motivational quote
  const [quoteIndex, setQuoteIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % MOOD_QUOTES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const getScoreColor = (s) => {
    if (s > 0.7) return 'text-emerald-400';
    if (s > 0.4) return 'text-ms-accent';
    return 'text-ms-secondary';
  };

  const getScoreBg = (s) => {
    if (s > 0.7) return 'from-emerald-500/20 to-emerald-500/5';
    if (s > 0.4) return 'from-ms-accent/20 to-ms-accent/5';
    return 'from-ms-secondary/20 to-ms-secondary/5';
  };

  const getScoreEmoji = (s) => {
    if (s > 0.7) return 'Thriving';
    if (s > 0.4) return 'Coping';
    return 'Needs Care';
  };

  const formatScore = (s) => Number(s).toFixed(2);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const chartData = scoreHistory.map(s => ({
    date: new Date(s.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    score: s.score,
  }));

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 pb-16 animate-fade-in relative">
      <MindfulBackground variant="auto" />
      {/* Background blobs */}
      <div className="fixed top-0 left-0 w-80 h-80 rounded-full opacity-5 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      <div className="fixed bottom-0 right-0 w-60 h-60 rounded-full opacity-5 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #14b8a6, transparent)' }} />

      <div className="max-w-5xl mx-auto relative">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden animate-glow-pulse shadow-md shadow-violet-900/50">
              <img src="/mindscript-icon.png" alt="MindScript" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-ms-primary-light to-ms-blue bg-clip-text text-transparent">
              MindScript
            </span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-ms-muted hover:text-ms-secondary transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* Welcome Banner */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 mb-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-ms-muted text-sm mb-1 flex items-center gap-1.5">
                {getGreeting()} <Heart className="w-3.5 h-3.5 text-ms-secondary animate-pulse" />
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-ms-text">
                {isFirstTime ? (
                  <>Welcome, <span className="bg-gradient-to-r from-ms-primary-light to-ms-blue bg-clip-text text-transparent">{userName}</span>!</>
                ) : (
                  <>Hey, <span className="bg-gradient-to-r from-ms-primary-light to-ms-blue bg-clip-text text-transparent">{userName}</span></>
                )}
              </h1>
              {isFirstTime ? (
                <p className="text-ms-muted mt-2 max-w-md">
                  Start your first session to begin tracking your mental wellness journey.
                </p>
              ) : (
                <p className="text-ms-muted mt-2">Ready for today's check-in?</p>
              )}
            </div>

            {latestScore !== null && (
              <div className="flex-1 min-w-[240px] max-w-sm relative group mt-4 sm:mt-0 animate-fade-in">
                <div className={`absolute inset-0 rounded-2xl opacity-20 bg-gradient-to-br ${getScoreBg(latestScore)} transition-opacity duration-500 group-hover:opacity-30 blur-sm`}></div>
                <div className="relative glass-card rounded-2xl p-5 border border-white/5 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-ms-text/90 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-ms-muted" /> Wellness State
                    </p>
                    <span className={`text-xs px-3 py-1 rounded-full bg-white/5 font-medium border border-white/10 shadow-sm ${getScoreColor(latestScore)}`}>
                      {getScoreEmoji(latestScore)}
                    </span>
                  </div>
                  
                  {/* Energy/Wellness Bar instead of a number */}
                  <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out relative"
                      style={{ 
                        width: `${Math.max(15, latestScore * 100)}%`,
                        background: latestScore > 0.7 ? '#34d399' : latestScore > 0.4 ? '#a78bfa' : '#fb7185',
                        boxShadow: `0 0 10px ${latestScore > 0.7 ? '#34d399' : latestScore > 0.4 ? '#a78bfa' : '#fb7185'}`
                      }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-[10px] text-ms-muted uppercase tracking-widest font-semibold mt-2">
                    <span>Recharging</span>
                    <span>Thriving</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Motivational Quote Card */}
        <div className="glass-card rounded-2xl p-4 mb-6 animate-slide-up flex items-center gap-3" style={{ animationDelay: '0.1s' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.15)' }}>
            <Quote className="w-4 h-4 text-ms-accent" />
          </div>
          <p className="text-sm text-ms-text/80 italic animate-fade-in" key={quoteIndex}>
            "{MOOD_QUOTES[quoteIndex]}"
          </p>
          <Sparkles className="w-4 h-4 text-ms-accent/40 flex-shrink-0 animate-pulse-slow" />
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <button
            onClick={onStartDiary}
            className="glass-card rounded-2xl p-6 text-left hover:border-ms-primary/30 transition-all duration-300 group animate-slide-up"
            style={{ animationDelay: '0.15s' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
              style={{ background: 'rgba(124,58,237,0.12)' }}>
              <BookOpen className="w-6 h-6 text-ms-primary-light" />
            </div>
            <h3 className="font-semibold text-ms-text mb-1">Diary Entry</h3>
            <p className="text-ms-muted text-sm">Write about your thoughts and feelings</p>
          </button>

          <button
            onClick={onStartQuiz}
            className="glass-card rounded-2xl p-6 text-left hover:border-ms-teal/30 transition-all duration-300 group animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
              style={{ background: 'rgba(20,184,166,0.12)' }}>
              <Activity className="w-6 h-6 text-ms-teal" />
            </div>
            <h3 className="font-semibold text-ms-text mb-1">Assessment</h3>
            <p className="text-ms-muted text-sm">Take a structured wellness check-in</p>
          </button>

          <button
            onClick={onStartChat}
            className="glass-card rounded-2xl p-6 text-left hover:border-ms-blue/30 transition-all duration-300 group animate-slide-up"
            style={{ animationDelay: '0.25s' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
              style={{ background: 'rgba(59,130,246,0.12)' }}>
              <MessageCircle className="w-6 h-6 text-ms-blue" />
            </div>
            <h3 className="font-semibold text-ms-text mb-1">Quick Chat</h3>
            <p className="text-ms-muted text-sm">Talk with your AI companion</p>
          </button>
        </div>

        {/* Score History Chart */}
        {scoreHistory.length > 1 && (
          <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-ms-primary-light" />
              <h3 className="font-semibold text-ms-text">Your Wellness Journey</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 mb-6 mt-2">
              <div className="rounded-2xl p-4 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/10 hover:border-indigo-500/30 transition-colors group">
                <div className="flex items-center gap-2 mb-2">
                  <Wind className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-indigo-100">Yoga & Breath</span>
                </div>
                <p className="text-xs text-ms-muted/90 leading-relaxed">Gentle stretches, breath awareness, and a short grounding flow can calm the mind and reset your day.</p>
              </div>

              <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/30 transition-colors group">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-emerald-100">Active Movement</span>
                </div>
                <p className="text-xs text-ms-muted/90 leading-relaxed">A brisk walk, a bodyweight set, or 5 minutes of mindful movement lifts your energy and supports resilience.</p>
              </div>

              <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/10 hover:border-amber-500/30 transition-colors group">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-amber-100">Motivation Focus</span>
                </div>
                <p className="text-xs text-ms-muted/90 leading-relaxed">Keep celebrating small wins, stay consistent, and remind yourself that progress is built one step at a time.</p>
              </div>

              <div className="rounded-2xl p-4 bg-gradient-to-br from-rose-500/10 to-rose-500/5 border border-rose-500/10 hover:border-rose-500/30 transition-colors group">
                <div className="flex items-center gap-2 mb-2">
                  <Smile className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-rose-100">Joyful Moments</span>
                </div>
                <p className="text-xs text-ms-muted/90 leading-relaxed">When you feel good, keep the momentum with gratitude journaling or a joy-filled ritual.</p>
              </div>
            </div>
            <div className="h-56 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#8888aa', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} tickLine={false} />
                  <YAxis domain={[0, 1]} tick={{ fill: '#8888aa', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} tickLine={false} />
                  <Tooltip
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
            </div>
          </div>
        )}

        {/* First time motivational message */}
        {isFirstTime && (
          <div className="glass-card rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Sparkles className="w-8 h-8 text-ms-accent mx-auto mb-3 animate-float" />
            <p className="text-ms-text font-medium">"The journey of a thousand miles begins with a single step."</p>
            <p className="text-ms-muted text-sm mt-2">Start your first session above to begin tracking</p>
          </div>
        )}
      </div>

      <ScrollingFooter />
    </div>
  );
};

export default DashboardPage;
