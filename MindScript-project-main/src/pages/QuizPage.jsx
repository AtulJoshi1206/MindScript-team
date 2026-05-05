import React, { useMemo } from 'react';
import { Activity, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import ScrollingFooter from '../components/ScrollingFooter';
import { getRandomizedAssessmentQuestions, ASSESSMENT_OPTION_LABELS } from '../constants';
import MindfulBackground from '../components/MindfulBackground';

const QuizPage = ({ quizAnswers, setQuizAnswers, handleQuizSubmit, onBack }) => {
  const questions = useMemo(() => getRandomizedAssessmentQuestions(), []);
  const optionLabels = ASSESSMENT_OPTION_LABELS;

  const answeredCount = Object.keys(quizAnswers).length;
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <div className="min-h-screen p-4 sm:p-6 pb-16 animate-fade-in relative">
      <MindfulBackground variant="cosmos" />
      <div className="max-w-2xl mx-auto relative z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-ms-muted hover:text-ms-primary-light transition-colors mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="glass-card rounded-2xl overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="p-6" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(20,184,166,0.1) 100%)' }}>
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-7 h-7 text-ms-teal" />
              <h2 className="text-xl font-bold text-ms-text">Wellness Assessment</h2>
            </div>
            <p className="text-ms-muted text-sm">Answer based on how you have felt over the last 2 weeks.</p>
            {/* Progress bar */}
            <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #14b8a6)' }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-ms-muted text-xs">{answeredCount} of {totalQuestions} answered</p>
              {answeredCount === totalQuestions && (
                <p className="text-ms-teal text-xs flex items-center gap-1 animate-fade-in">
                  <Sparkles className="w-3 h-3" /> All done!
                </p>
              )}
            </div>
          </div>

          {/* Questions */}
          <div className="p-6 space-y-8">
            {questions.map((q, idx) => (
              <div key={idx} className="animate-fade-in" style={{ animationDelay: `${idx * 0.03}s` }}>
                <p className="font-medium text-ms-text mb-3 text-[15px]">
                  <span className="text-ms-primary-light mr-2">{idx + 1}.</span>{q}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4].map((val) => {
                    const isSelected = quizAnswers[idx] === val;
                    return (
                      <button
                        key={val}
                        onClick={() => setQuizAnswers(prev => ({ ...prev, [idx]: val }))}
                        className={`flex-1 min-w-[70px] py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isSelected
                            ? 'text-white shadow-lg scale-[1.02]'
                            : 'text-ms-muted hover:text-ms-text hover:scale-[1.01]'
                          }`}
                        style={isSelected
                          ? { background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)' }
                          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }
                        }
                      >
                        {optionLabels[val]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={() => handleQuizSubmit(questions)}
              disabled={answeredCount < totalQuestions}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-xl mt-4"
            >
              <CheckCircle2 className="w-5 h-5" /> Complete Assessment
            </button>

            <p className="text-center text-ms-muted/40 text-xs italic">
              "Knowing yourself is the beginning of all wisdom." - Aristotle
            </p>
          </div>
        </div>
      </div>

      <ScrollingFooter />
    </div>
  );
};

export default QuizPage;
