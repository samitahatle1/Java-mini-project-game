import React, { useState } from 'react';
import { Sparkles, HelpCircle, Check, X, ShieldAlert, ArrowRight } from 'lucide-react';
import { Waypoint, Theme } from '../types';
import { api } from '../services/api';
import { sound } from '../services/audio';

interface MCQModalProps {
  sessionId: string;
  waypoint: Waypoint;
  theme: Theme;
  hintsRemaining: number;
  onAnswered: (result: { isCorrect: boolean; correctAnswer: string | null; score: number }) => void;
  onHintUsed: (eliminated: string, remaining: number) => void;
  onClose?: () => void;
}

export const MCQModal: React.FC<MCQModalProps> = ({
  sessionId,
  waypoint,
  theme,
  hintsRemaining,
  onAnswered,
  onHintUsed,
  onClose
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; correctAnswer: string | null } | null>(null);
  const [isWobbling, setIsWobbling] = useState(false);

  const options = waypoint.options || [];

  const handleUseHint = async () => {
    if (hintsRemaining <= 0 || submitting || result) return;
    try {
      const res = await api.useHint(sessionId, waypoint.index);
      sound.playHint();
      setEliminatedOptions(prev => [...prev, res.eliminatedOption]);
      onHintUsed(res.eliminatedOption, res.hintsRemaining);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectAnswer = async (opt: string) => {
    if (submitting || result || eliminatedOptions.includes(opt)) return;

    setSelectedOption(opt);
    setSubmitting(true);

    try {
      const res = await api.submitWaypointAnswer(sessionId, waypoint.index, opt);
      if (res.isCorrect) {
        sound.playCorrect();
      } else {
        sound.playIncorrect();
        setIsWobbling(true);
        setTimeout(() => setIsWobbling(false), 400);
      }

      setResult({
        isCorrect: res.isCorrect,
        correctAnswer: res.correctAnswer
      });

      // Brief delay so player sees feedback animation
      setTimeout(() => {
        onAnswered({
          isCorrect: res.isCorrect,
          correctAnswer: res.correctAnswer,
          score: res.score
        });
      }, 1200);

    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  };

  // Get theme chrome class per §9.5.B
  const themeChromeClass = 
    theme.id === 'nature' ? 'theme-chrome-nature' :
    theme.id === 'school' ? 'theme-chrome-school' :
    theme.id === 'cartoon' ? 'theme-chrome-cartoon' :
    theme.id === 'bighouse' ? 'theme-chrome-bighouse' :
    theme.id === 'warfield' ? 'theme-chrome-warfield' :
    theme.id === 'supermarket' ? 'theme-chrome-supermarket' :
    'theme-chrome-horror';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-pop">
      <div className={`w-full max-w-lg p-6 md:p-8 transition-all relative ${themeChromeClass} ${
        isWobbling ? 'animate-gentle-shake' : ''
      }`}>
        
        {/* Header with Category Badge & Hint Counter */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{waypoint.categoryIcon || '🎯'}</span>
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${theme.hud.badgeBg}`}>
                Waypoint #{waypoint.index + 1} • {waypoint.room}
              </span>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">
                {waypoint.category}
              </div>
            </div>
          </div>

          {/* Hint Button */}
          <button
            type="button"
            onClick={handleUseHint}
            disabled={hintsRemaining <= 0 || !!result}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            title="Eliminate one wrong answer"
          >
            <HelpCircle size={14} className="text-amber-600" />
            <span>Hint ({hintsRemaining})</span>
          </button>
        </div>

        {/* Question Prompt */}
        <div className="mb-6">
          <h3 className={`text-lg md:text-xl font-bold font-heading leading-snug ${
            theme.isHorror ? 'text-purple-100' : 'text-[#3A3A45]'
          }`}>
            {waypoint.prompt}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Choose what your friend actually answered!
          </p>
        </div>

        {/* 4 MCQ Option Buttons */}
        <div className="space-y-3">
          {options.map((opt, idx) => {
            const isEliminated = eliminatedOptions.includes(opt);
            const isSelected = selectedOption === opt;
            const isCorrectAnswer = result && result.correctAnswer === opt;
            const isWrongSelection = result && isSelected && !result.isCorrect;

            let buttonStyle = theme.isHorror 
              ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-purple-400' 
              : 'bg-white border-slate-200 hover:border-purple-300 text-slate-800';

            if (isEliminated) {
              buttonStyle = 'opacity-30 line-through bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed';
            } else if (result && (isSelected && result.isCorrect || isCorrectAnswer)) {
              buttonStyle = 'bg-emerald-500 text-white border-emerald-600 shadow-md font-bold scale-[1.02]';
            } else if (isWrongSelection) {
              buttonStyle = 'bg-amber-100/90 text-amber-900 border-amber-300 font-semibold';
            } else if (isSelected) {
              buttonStyle = 'bg-purple-600 text-white border-purple-700 shadow-sm';
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isEliminated || !!result || submitting}
                onClick={() => handleSelectAnswer(opt)}
                className={`w-full p-4 rounded-2xl border-2 text-left text-xs md:text-sm transition-all duration-200 flex items-center justify-between gap-3 ${buttonStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="leading-snug">{opt}</span>
                </div>

                {result && (isSelected && result.isCorrect || isCorrectAnswer) && (
                  <Check size={18} className="shrink-0 text-white animate-pop" />
                )}
                {isWrongSelection && (
                  <X size={18} className="shrink-0 text-amber-700" />
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback Message */}
        {result && (
          <div className={`mt-5 p-3.5 rounded-2xl text-xs font-semibold text-center animate-pop flex items-center justify-center gap-2 ${
            result.isCorrect 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
              : 'bg-amber-50 border border-amber-200 text-amber-800'
          }`}>
            {result.isCorrect ? (
              <>
                <Sparkles size={16} className="text-emerald-600" />
                <span>Spot on! You know your bestfriend so well! (+1 Score)</span>
              </>
            ) : (
              <>
                <ShieldAlert size={16} className="text-amber-600" />
                <span>Gentle miss! Your friend actually picked: <strong>"{result.correctAnswer}"</strong></span>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
