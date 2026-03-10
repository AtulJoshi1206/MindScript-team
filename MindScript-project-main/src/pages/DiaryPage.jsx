import React from 'react';
import { BookOpen, ArrowLeft, Send, Heart } from 'lucide-react';
import ScrollingFooter from '../components/ScrollingFooter';
import MindfulBackground from '../components/MindfulBackground';

const DiaryPage = ({ inputData, setInputData, handleDiarySubmit, onBack }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pb-16 animate-fade-in relative">
      <MindfulBackground variant="aurora" />
      <div className="w-full max-w-2xl">
        <button onClick={onBack} className="flex items-center gap-2 text-ms-muted hover:text-ms-primary-light transition-colors mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="glass-card rounded-2xl p-6 sm:p-8 animate-slide-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.12)' }}>
              <BookOpen className="w-5 h-5 text-ms-primary-light" />
            </div>
            <h2 className="text-xl font-bold text-ms-text">Dear MindScript...</h2>
          </div>
          <p className="text-ms-muted text-sm mb-5 flex items-center gap-1.5">
            This is a safe space. Write whatever is on your heart <Heart className="w-3.5 h-3.5 text-ms-secondary/60" />
          </p>

          <textarea
            className="input-field min-h-[300px] resize-none text-base leading-relaxed"
            placeholder="Tell me what's on your mind... Write freely about your day, your thoughts, how you're feeling..."
            value={inputData.content}
            onChange={(e) => setInputData({ ...inputData, content: e.target.value })}
          />

          {inputData.content.trim() && (
            <p className="text-ms-muted/50 text-xs mt-2 text-right animate-fade-in">
              {inputData.content.trim().split(/\s+/).length} words
            </p>
          )}

          <button
            onClick={handleDiarySubmit}
            disabled={!inputData.content.trim()}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-xl"
          >
            <Send className="w-5 h-5" /> Analyze & Chat
          </button>
        </div>

        <p className="text-center text-ms-muted/40 text-xs mt-6 italic animate-fade-in" style={{ animationDelay: '0.3s' }}>
          "Writing is the painting of the voice." - Voltaire
        </p>
      </div>

      <ScrollingFooter />
    </div>
  );
};

export default DiaryPage;
