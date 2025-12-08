import React from 'react';
import { BookOpen } from 'lucide-react';
import ScrollingFooter from '../components/ScrollingFooter';

const DiaryPage = ({ inputData, setInputData, handleDiarySubmit, setView }) => {
  return (
    <div className="min-h-screen py-12 px-4 flex flex-col items-center justify-center text-dark-text animate-fade-in">
      <div className="w-full max-w-3xl bg-dark-card rounded-3xl shadow-xl p-8 animate-slide-in-left">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-dark-primary flex items-center gap-2">
            <BookOpen size={24} className="text-dark-secondary"/> Dear Sathi...
          </h2>
          <button 
            onClick={() => setView('input-select')} 
            className="text-dark-text opacity-70 hover:text-dark-primary font-medium px-3 py-1 rounded-md transition-colors"
          >
            Back
          </button>
        </div>
        <textarea
          className="w-full h-80 p-5 border border-dark-text opacity-20 rounded-xl focus:ring-2 focus:ring-dark-primary focus:border-transparent outline-none resize-none bg-dark-bg text-dark-text text-lg shadow-inner placeholder-dark-text/50"
          placeholder="Tell me what's on your mind..."
          value={inputData.content}
          onChange={(e) => setInputData({ ...inputData, content: e.target.value })}
        />
        <button 
          onClick={handleDiarySubmit}
          disabled={!inputData.content.trim()}
          className="w-full mt-6 bg-dark-primary text-white py-4 rounded-full font-bold tracking-wide text-lg hover:bg-dark-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl animate-pop-in"
        >
          Analyze & Chat
        </button>
      </div>
      <ScrollingFooter className="mt-12" />
    </div>
  );
};

export default DiaryPage;
