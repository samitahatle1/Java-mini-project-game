import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight, ArrowLeft, Send, Heart, Lightbulb, Zap, Users, SplitSquareVertical } from 'lucide-react';
import { Session, Question } from '../types';
import { api } from '../services/api';
import { sound } from '../services/audio';
import { wsService } from '../services/websocket';

interface AnswererQuizProps {
  session: Session;
  isCurrentAnswerer: boolean;
  onAnswersSubmitted: (session: Session) => void;
  onSwitchToAnswerer?: () => void;
  onToggleSplitView?: () => void;
  onQuickAutoFill?: () => void;
}

export const AnswererQuiz: React.FC<AnswererQuizProps> = ({
  session,
  isCurrentAnswerer,
  onAnswersSubmitted,
  onSwitchToAnswerer,
  onToggleSplitView,
  onQuickAutoFill
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customText, setCustomText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions: Question[] = session.questions || [];
  const currentQ = questions[currentIndex];

  const handleSelectOption = (text: string) => {
    sound.playClick();
    setAnswers(prev => ({ ...prev, [currentQ.id]: text }));
    setCustomText('');
    wsService.sendTypingProgress(currentIndex + 1);
  };

  const handleNext = () => {
    if (!answers[currentQ.id] && !customText.trim()) {
      setError('Please select or type your answer before continuing!');
      return;
    }

    if (customText.trim()) {
      setAnswers(prev => ({ ...prev, [currentQ.id]: customText.trim() }));
      setCustomText('');
    }

    setError(null);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      wsService.sendTypingProgress(currentIndex + 2);
    }
  };

  const handlePrev = () => {
    setError(null);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmitAll = async () => {
    let finalAnswers = { ...answers };
    if (customText.trim() && currentQ) {
      finalAnswers[currentQ.id] = customText.trim();
    }

    const unanswered = questions.filter(q => !finalAnswers[q.id]);
    if (unanswered.length > 0) {
      setError(`Please answer question #${questions.indexOf(unanswered[0]) + 1} before submitting!`);
      return;
    }

    setError(null);
    setSubmitting(true);
    sound.playClick();

    try {
      const payload = questions.map(q => ({
        questionId: q.id,
        answerText: finalAnswers[q.id]
      }));

      const res = await api.submitTruthAnswers(session.id, payload);
      sound.playCorrect();
      onAnswersSubmitted(res.session);
    } catch (err: any) {
      setError(err.message || 'Failed to submit answers');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick 1-click auto-fill for testing/solo play
  const handleAutoFillAndSubmit = async () => {
    setError(null);
    setSubmitting(true);
    sound.playClick();

    try {
      const payload = questions.map(q => ({
        questionId: q.id,
        answerText: q.distractors[0] || 'My favorite choice'
      }));

      const res = await api.submitTruthAnswers(session.id, payload);
      sound.playCorrect();
      onAnswersSubmitted(res.session);
    } catch (err: any) {
      setError(err.message || 'Failed to auto-fill answers');
    } finally {
      setSubmitting(false);
    }
  };

  // If viewing player is the Finder, show the waiting companion screen WITH direct controls:
  if (!isCurrentAnswerer) {
    return (
      <div className="w-full max-w-xl mx-auto p-4 md:p-6 text-center space-y-6 animate-pop">
        <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-purple-200/90 shadow-lg space-y-5">
          <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-3xl mx-auto flex items-center justify-center text-4xl animate-float shadow-inner">
            ⏳
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-pink-100 text-pink-700">
              Truth Round In Progress
            </span>
            <h2 className="text-2xl font-bold font-heading text-[#3A3A45] mt-2">
              Waiting for {session.answererName} to Answer...
            </h2>
            <p className="text-xs md:text-sm text-slate-600 max-w-md mx-auto mt-1">
              Your friend is setting down their 10 personal truth answers. Once submitted, you'll explore <strong className="text-purple-700">{session.themeName}</strong> to find them!
            </p>
          </div>

          {/* Action options for testing/solo players */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-left space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
              <Zap size={14} className="text-amber-500" />
              <span>Playing or Testing Right Now?</span>
            </span>

            <div className="space-y-2">
              {/* Option 1: 1-Click Auto Fill and jump straight into 2D world exploration */}
              <button
                type="button"
                onClick={onQuickAutoFill || handleAutoFillAndSubmit}
                disabled={submitting}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 hover:opacity-95 text-white font-bold text-xs md:text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Zap size={16} />
                <span>{submitting ? 'Generating Answers...' : '⚡ Quick Auto-Fill & Drop Into 2D World Now!'}</span>
              </button>

              {/* Option 2: Switch to answer questions yourself */}
              {onSwitchToAnswerer && (
                <button
                  type="button"
                  onClick={onSwitchToAnswerer}
                  className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-purple-200 text-purple-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Users size={15} />
                  <span>Answer Questions as {session.answererName}</span>
                </button>
              )}

              {/* Option 3: Duo Split-Screen View */}
              {onToggleSplitView && (
                <button
                  type="button"
                  onClick={onToggleSplitView}
                  className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <SplitSquareVertical size={15} />
                  <span>Enable Duo Split-Screen Mode</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Answerer Quiz Deck UI
  const currentSelection = answers[currentQ?.id] || '';
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6 space-y-5 animate-pop">
      
      {/* Top Progress Bar & Auto Fill Helper */}
      <div className="bg-white p-4 rounded-3xl border border-purple-100 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 flex-wrap gap-2">
          <span className="flex items-center gap-1.5">
            <span className="text-base">{currentQ?.categoryIcon || '✨'}</span>
            <span className="font-bold text-slate-800">{currentQ?.category}</span>
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAutoFillAndSubmit}
              disabled={submitting}
              className="text-[11px] font-bold text-purple-600 hover:text-purple-800 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200 flex items-center gap-1 transition-colors"
              title="Auto fill all 10 questions and jump straight into 2D world"
            >
              <Zap size={12} />
              <span>Auto-Fill All (Quick Test)</span>
            </button>
            <span className="text-purple-700 font-bold">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
        </div>

        {/* Continuous progress track */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-400 to-amber-400 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-gentle-shake">
          {error}
        </div>
      )}

      {/* Main Question Card */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-purple-200/80 shadow-md space-y-6">
        
        {/* Prompt */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
            Confidential Answer Set
          </span>
          <h3 className="text-lg md:text-xl font-bold font-heading text-[#3A3A45] mt-2">
            {currentQ?.prompt}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Choose the answer that fits you best, or type your own custom answer below.
          </p>
        </div>

        {/* Curated Choice Options */}
        <div className="space-y-2.5">
          {currentQ?.distractors?.map((opt, idx) => {
            const isSelected = currentSelection === opt && !customText.trim();
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(opt)}
                className={`w-full p-3.5 rounded-2xl border text-left text-xs md:text-sm font-medium transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50/80 text-purple-900 shadow-2xs font-semibold'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300 text-slate-700'
                }`}
              >
                <span>{opt}</span>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs shrink-0">
                    <Check size={13} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Answer Input */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
            <Lightbulb size={14} className="text-amber-500" />
            <span>Or write your exact personal answer:</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. My grandma's homemade spicy mac & cheese"
              value={customText}
              onChange={(e) => {
                setCustomText(e.target.value);
                if (e.target.value.trim()) {
                  setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value.trim() }));
                }
              }}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <ArrowLeft size={15} />
            <span>Previous</span>
          </button>

          {!isLastQuestion ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-2xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Next Question</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitAll}
              disabled={submitting}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 text-white text-xs font-bold hover:opacity-95 transition-opacity flex items-center gap-1.5 shadow-md disabled:opacity-50"
            >
              <Send size={15} />
              <span>{submitting ? 'Locking Answers...' : 'Lock In & Start Exploration!'}</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
