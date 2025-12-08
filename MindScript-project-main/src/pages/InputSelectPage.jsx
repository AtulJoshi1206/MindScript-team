import React from 'react';
import { BookOpen, Activity } from 'lucide-react';
import ScrollingFooter from '../components/ScrollingFooter';

const InputSelectPage = ({ setView }) => {
  return (
    <div className="min-h-screen py-12 px-4 flex flex-col items-center justify-center text-dark-text animate-fade-in">
      <h2 className="text-4xl font-extrabold tracking-tight text-dark-primary mb-12 animate-slide-in-left">How would you like to express yourself?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
        <button 
          onClick={() => setView('diary')}
          className="bg-dark-card p-10 rounded-3xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-dark-primary flex flex-col items-center group animate-pop-in"
          style={{ animationDelay: "0.1s" }}
        >
          <BookOpen className="w-16 h-16 text-dark-primary mb-6 group-hover:scale-110 transition-transform duration-300" />
          <h3 className="text-2xl font-bold text-dark-text mb-3">Diary Entry</h3>
          <p className="text-dark-text text-center text-base opacity-90">Freely write about your day, thoughts, and feelings.</p>
        </button>
        <button 
          onClick={() => setView('quiz')}
          className="bg-dark-card p-10 rounded-3xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-dark-secondary flex flex-col items-center group animate-pop-in"
          style={{ animationDelay: "0.2s" }}
        >
          <Activity className="w-16 h-16 text-dark-secondary mb-6 group-hover:scale-110 transition-transform duration-300" />
          <h3 className="text-2xl font-bold text-dark-text mb-3">Assessment</h3>
          <p className="text-dark-text text-center text-base opacity-90">Take a 15-question structured check-in.</p>
        </button>
      </div>
      <ScrollingFooter className="mt-12" />
    </div>
  );
};

export default InputSelectPage;
