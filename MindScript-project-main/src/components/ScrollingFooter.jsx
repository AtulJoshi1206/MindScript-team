import React from 'react';
import { MOOD_QUOTES } from "../constants";

const ScrollingFooter = () => (
  <div className="fixed bottom-0 left-0 w-full bg-dark-card text-dark-text py-3 overflow-hidden z-50 shadow-lg">
    <div className="animate-marquee whitespace-nowrap flex gap-16">
      {[...MOOD_QUOTES, ...MOOD_QUOTES].map((quote, i) => (
        <span key={i} className="text-base font-light opacity-90 mx-6 text-dark-secondary animate-pulse-slow">
          ✨ {quote}
        </span>
      ))}
    </div>
  </div>
);

export default ScrollingFooter;
