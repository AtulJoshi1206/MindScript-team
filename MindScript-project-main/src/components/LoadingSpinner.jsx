import React from 'react';
import { Heart } from 'lucide-react';

const LOADING_QUOTES = [
  "Understanding your feelings...",
  "Every emotion tells a story...",
  "Your wellbeing matters...",
  "Processing with care...",
];

const LOADING_QUOTE = LOADING_QUOTES[Math.floor(Math.random() * LOADING_QUOTES.length)];

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fade-in relative">
      {/* Background glow */}
      <div className="absolute w-64 h-64 rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />

      <div className="relative">
        <div className="w-20 h-20 rounded-2xl overflow-hidden mb-6 animate-glow-pulse shadow-xl shadow-violet-900/50">
          <img src="/mindscript-icon.png" alt="MindScript" className="w-full h-full object-cover animate-pulse" />
        </div>

        {/* Orbiting heart */}
        <div className="absolute -top-1 -right-1 animate-float">
          <Heart className="w-5 h-5 text-ms-secondary/60" fill="currentColor" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-ms-text mb-2 animate-pulse">Analyzing...</h2>
      <p className="text-ms-muted text-sm mb-6">{LOADING_QUOTE}</p>

      {/* Progress dots */}
      <div className="flex gap-2">
        <div className="w-2 h-2 rounded-full bg-ms-primary-light animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 rounded-full bg-ms-primary-light animate-bounce" style={{ animationDelay: '0.15s' }}></div>
        <div className="w-2 h-2 rounded-full bg-ms-primary-light animate-bounce" style={{ animationDelay: '0.3s' }}></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
