import React from 'react';
import { BookOpen, Activity, ArrowLeft, Sparkles } from 'lucide-react';
import ScrollingFooter from '../components/ScrollingFooter';
import MindfulBackground from '../components/MindfulBackground';

const InputSelectPage = ({ onSelectDiary, onSelectQuiz, onBack }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pb-16 animate-fade-in relative">
      <MindfulBackground variant="forest" />

      <div className="w-full max-w-2xl relative">
        <button onClick={onBack} className="flex items-center gap-2 text-ms-muted hover:text-ms-primary-light transition-colors mb-6 text-sm animate-fade-in">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="text-center mb-8 animate-slide-up">
          <Sparkles className="w-6 h-6 text-ms-accent mx-auto mb-3 animate-float" />
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-ms-primary-light to-ms-teal bg-clip-text text-transparent">
            How would you like to express yourself?
          </h2>
          <p className="text-ms-muted text-sm mt-2">Choose the method that feels right for you today</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <button
            onClick={onSelectDiary}
            className="glass-card rounded-2xl p-8 text-center hover:border-ms-primary/30 transition-all duration-300 group animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform"
              style={{ background: 'rgba(124,58,237,0.12)' }}>
              <BookOpen className="w-8 h-8 text-ms-primary-light" />
            </div>
            <h3 className="text-xl font-bold text-ms-text mb-2">Diary Entry</h3>
            <p className="text-ms-muted text-sm">Freely write about your day, thoughts, and feelings.</p>
          </button>

          <button
            onClick={onSelectQuiz}
            className="glass-card rounded-2xl p-8 text-center hover:border-ms-teal/30 transition-all duration-300 group animate-slide-up"
            style={{ animationDelay: '0.15s' }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform"
              style={{ background: 'rgba(20,184,166,0.12)' }}>
              <Activity className="w-8 h-8 text-ms-teal" />
            </div>
            <h3 className="text-xl font-bold text-ms-text mb-2">Assessment</h3>
            <p className="text-ms-muted text-sm">Take a 14-question structured wellness check-in.</p>
          </button>
        </div>

        {/* Encouraging message */}
        <p className="text-center text-ms-muted/50 text-xs mt-8 animate-fade-in italic" style={{ animationDelay: '0.3s' }}>
          "Every moment of self-reflection is a step towards growth."
        </p>
      </div>

      <ScrollingFooter />
    </div>
  );
};

export default InputSelectPage;
