import React, { useEffect, useState, useRef } from 'react';

// Three cinematic backgrounds, each with a meaning
const BACKGROUNDS = [
  {
    src: '/bg_aurora.png',
    // Aurora: northern lights = renewal, clarity of mind, natural harmony
    gradient: 'from-[#0a0a1a]/80 via-[#0d1a2e]/60 to-[#0a1220]/80',
    accent: 'rgba(20,184,166,0.08)',
  },
  {
    src: '/bg_forest.png',
    // Forest: ancient trees = groundedness, healing, path through darkness
    gradient: 'from-[#080f08]/80 via-[#0d1a0d]/60 to-[#0a0a1a]/80',
    accent: 'rgba(34,197,94,0.06)',
  },
  {
    src: '/bg_cosmos.png',
    // Cosmos: infinite universe = perspective, wonder, infinite potential
    gradient: 'from-[#0a0a1a]/85 via-[#120a2a]/65 to-[#0a0a1a]/85',
    accent: 'rgba(124,58,237,0.08)',
  },
];
const VARIANT_INDEX = { aurora: 0, forest: 1, cosmos: 2 };

// Floating particle dot
function Particle({ style }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: style.size,
        height: style.size,
        left: style.x,
        top: style.y,
        background: style.color,
        opacity: style.opacity,
        animation: `particleFloat ${style.duration}s ease-in-out infinite`,
        animationDelay: `${style.delay}s`,
        filter: 'blur(1px)',
      }}
    />
  );
}

const PARTICLES = Array.from({ length: 18 }, () => ({
  size: `${Math.random() * 4 + 2}px`,
  x: `${Math.random() * 100}%`,
  y: `${Math.random() * 100}%`,
  opacity: Math.random() * 0.4 + 0.1,
  duration: Math.random() * 8 + 6,
  delay: Math.random() * 5,
  color: [
    'rgba(167,139,250,0.8)',  // violet
    'rgba(20,184,166,0.7)',   // teal
    'rgba(59,130,246,0.7)',   // blue
    'rgba(255,255,255,0.6)',  // white
  ][Math.floor(Math.random() * 4)],
}));

export default function MindfulBackground({ variant = 'auto' }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const intervalRef = useRef(null);

  // Determine background based on variant or auto-cycle
  useEffect(() => {
    if (variant !== 'auto') {
      return;
    }

    intervalRef.current = setInterval(() => {
      setTransitioning(true);
      setPrevIdx(idx => idx);
      setActiveIdx(prev => {
        const next = (prev + 1) % BACKGROUNDS.length;
        return next;
      });
      setTimeout(() => setTransitioning(false), 1800);
    }, 12000);

    return () => clearInterval(intervalRef.current);
  }, [variant]);

  const displayedIdx = variant === 'auto' ? activeIdx : VARIANT_INDEX[variant] ?? 0;
  const bg = BACKGROUNDS[displayedIdx];
  const prevBg = prevIdx !== null ? BACKGROUNDS[prevIdx] : null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">

      {/* Previous image fading out */}
      {prevBg && transitioning && (
        <div
          key={`prev-${prevIdx}`}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${prevBg.src})`,
            animation: 'bgFadeOut 1.8s ease-in-out forwards',
          }}
        />
      )}

      {/* Active image fading in */}
      <div
        key={`active-${displayedIdx}`}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${bg.src})`,
          animation: 'bgFadeIn 1.8s ease-in-out forwards, bgSlowZoom 24s ease-in-out infinite',
        }}
      />

      {/* Dark overlay gradient for readability */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            to bottom,
            rgba(8,8,24,0.82) 0%,
            rgba(10,10,26,0.55) 40%,
            rgba(10,10,26,0.55) 60%,
            rgba(8,8,24,0.88) 100%
          )`,
        }}
      />

      {/* Subtle accent color layer that shifts with each bg */}
      <div
        className="absolute inset-0 transition-all duration-[2000ms]"
        style={{ background: `radial-gradient(ellipse at 50% 50%, ${bg.accent} 0%, transparent 70%)` }}
      />

      {/* Top vignette */}
      <div
        className="absolute inset-x-0 top-0 h-40 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(8,8,24,0.9), transparent)' }}
      />

      {/* Bottom vignette */}
      <div
        className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(8,8,24,0.9), transparent)' }}
      />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <Particle key={i} style={p} />
      ))}

      {/* Ambient glow orbs */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '600px',
          height: '600px',
          top: '-150px',
          right: '-150px',
          background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)',
          animation: 'orbFloat 14s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '500px',
          height: '500px',
          bottom: '-100px',
          left: '-100px',
          background: 'radial-gradient(circle, rgba(20,184,166,0.05) 0%, transparent 70%)',
          animation: 'orbFloat 18s ease-in-out infinite reverse',
        }}
      />

      {/* Subtle horizontal shimmer line */}
      <div
        className="absolute inset-x-0 pointer-events-none"
        style={{
          top: '35%',
          height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(167,139,250,0.15), rgba(20,184,166,0.12), transparent)',
          animation: 'shimmerLine 6s ease-in-out infinite',
        }}
      />
    </div>
  );
}
