import React from 'react';
import { Activity } from 'lucide-react';
import ScrollingFooter from '../components/ScrollingFooter';
import { ASSESSMENT_QUESTIONS } from '../constants';

const QuizPage = ({ quizAnswers, setQuizAnswers, handleQuizSubmit }) => {
  return (
    <div className="min-h-screen py-12 px-4 flex flex-col items-center justify-center text-dark-text animate-fade-in">
      <div className="w-full max-w-3xl bg-dark-card rounded-3xl shadow-xl overflow-hidden animate-slide-in-left">
        <div className="bg-dark-primary p-6">
          <h2 className="text-dark-text text-2xl font-extrabold flex items-center gap-3">
            <Activity className="w-8 h-8"/> Wellness Assessment
          </h2>
          <p className="text-dark-text opacity-80 text-base mt-2">Answer based on how you have felt over the last 2 weeks.</p>
        </div>
        <div className="p-8 space-y-10">
          {ASSESSMENT_QUESTIONS.map((q, idx) => (
            <div key={idx} className="space-y-4">
              <p className="font-semibold text-dark-text text-lg">{idx + 1}. {q}</p>
              <div className="flex justify-between gap-3">
                {[0, 1, 2, 3, 4].map((val) => (
                  <button
                    key={val}
                    onClick={() => setQuizAnswers(prev => ({...prev, [idx]: val}))}
                    className={`flex-1 py-3 rounded-full text-base font-medium transition-all shadow-md border ${
                      quizAnswers[idx] === val 
                        ? 'bg-dark-primary text-white border-dark-primary hover:bg-dark-secondary'
                        : 'bg-dark-bg text-dark-text border-dark-text/30 hover:bg-dark-card hover:border-dark-primary'
                    }`}
                  >
                    {['Never', 'Rarely', 'Sometimes', 'Often', 'Always'][val]}
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          <button 
            onClick={handleQuizSubmit}
            disabled={Object.keys(quizAnswers).length < ASSESSMENT_QUESTIONS.length}
            className="w-full mt-8 bg-dark-secondary text-white py-4 rounded-full font-extrabold tracking-wide text-lg shadow-lg hover:bg-dark-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all animate-pop-in"
          >
            Complete Assessment
          </button>
        </div>
      </div>
      <ScrollingFooter className="mt-12" />
    </div>
  );
};

export default QuizPage;
