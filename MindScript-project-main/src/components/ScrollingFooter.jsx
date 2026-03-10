import React from 'react';
import { MOOD_QUOTES } from "../constants";
import { Sparkles } from 'lucide-react';

const ScrollingFooter = () => (
  <div className="fixed bottom-0 left-0 w-full py-3 overflow-hidden z-50"
       style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(10,10,26,0.95) 30%, rgba(10,10,26,0.98) 100%)', borderTop: '1px solid rgba(124,58,237,0.15)' }}>
    <div className="animate-marquee whitespace-nowrap flex gap-12">
      {[...MOOD_QUOTES, ...MOOD_QUOTES].map((quote, i) => (
        <span key={i} className="text-sm mx-4 inline-flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-ms-primary-light/60 flex-shrink-0" />
          <span className="bg-gradient-to-r from-ms-primary-light/80 to-ms-teal/70 bg-clip-text text-transparent font-medium">
            {quote}
          </span>
        </span>
      ))}
    </div>
  </div>
);

export default ScrollingFooter;
