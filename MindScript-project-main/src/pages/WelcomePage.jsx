import React from 'react';
import { Heart, ChevronRight, WifiOff } from 'lucide-react';
import ScrollingFooter from '../components/ScrollingFooter';

const WelcomePage = ({ handleStart, isGuestMode }) => {
  return (
    <div className="min-h-screen py-12 px-4 flex flex-col items-center justify-center text-dark-text animate-fade-in">
      <div className="bg-dark-card p-10 rounded-3xl shadow-xl max-w-md w-full transform transition-all hover:scale-105 duration-500 animate-pop-in">
        <div className="bg-dark-bg w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <Heart className="w-12 h-12 text-dark-primary animate-pulse" />
        </div>
        <h1 className="text-5xl font-extrabold text-dark-primary mb-3 tracking-tight">Sathi</h1>
        <p className="text-dark-text opacity-90 mb-10 text-lg">Your companion for mental wellness. Talk, track, and heal together.</p>
        {isGuestMode && (
           <div className="mb-8 bg-dark-accent/20 text-dark-accent text-sm py-2.5 px-5 rounded-full border border-dark-accent/40 inline-flex items-center gap-2 animate-fade-in">
              <WifiOff size={16} /> Guest Mode Enabled
           </div>
        )}
        <button 
          onClick={handleStart}
          className="w-full bg-dark-primary hover:bg-dark-secondary text-white font-bold py-4 rounded-full shadow-lg transition-all flex items-center justify-center gap-3 text-lg animate-slide-in-left"
        >
          Start Session <ChevronRight size={22} />
        </button>
      </div>
      <ScrollingFooter className="mt-12" />
    </div>
  );
};

export default WelcomePage;
