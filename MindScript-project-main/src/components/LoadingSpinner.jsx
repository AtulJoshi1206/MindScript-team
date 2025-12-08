import React from 'react';
import { BrainCircuit } from 'lucide-react';

const LoadingSpinner = () => (
  <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-6 text-center animate-fade-in">
    <BrainCircuit className="w-20 h-20 text-dark-primary animate-bounce mb-8" />
    <h2 className="text-3xl font-extrabold text-dark-text mb-3 animate-pulse">Sathi is analyzing...</h2>
    <p className="text-dark-text opacity-80 text-lg">Understanding your feelings to support you better.</p>
  </div>
);

export default LoadingSpinner;
