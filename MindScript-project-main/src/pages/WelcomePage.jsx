import React from 'react';
import { ChevronRight } from 'lucide-react';
import ScrollingFooter from '../components/ScrollingFooter';

const WelcomePage = ({ handleStart }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="glass-card rounded-3xl p-10 max-w-md w-full text-center animate-pop-in">
        <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-6 animate-float shadow-xl shadow-violet-900/50">
          <img src="/mindscript-icon.png" alt="MindScript" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-ms-primary-light via-ms-blue to-ms-teal bg-clip-text text-transparent">
          MindScript
        </h1>
        <p className="text-ms-muted mb-8 text-base leading-relaxed">
          Your AI companion for mental wellness.<br />Talk, track, and heal together.
        </p>
        <button
          onClick={handleStart}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg rounded-2xl"
        >
          Get Started <ChevronRight size={22} />
        </button>
      </div>
      <ScrollingFooter />
    </div>
  );
};

export default WelcomePage;
