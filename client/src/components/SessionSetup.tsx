import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, Shield, Play, Lock, AlertCircle, HelpCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Account, Theme, DifficultyLevel, Player } from '../types';
import { api } from '../services/api';
import { sound } from '../services/audio';

interface SessionSetupProps {
  account: Account;
  currentPlayer: Player;
  currentRole: 'user1' | 'user2';
  onStartSession: (session: any) => void;
  onDevUnlockHorror: () => void;
}

export const SessionSetup: React.FC<SessionSetupProps> = ({
  account,
  currentPlayer,
  currentRole,
  onStartSession,
  onDevUnlockHorror
}) => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string>('nature');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [finderRole, setFinderRole] = useState<'user1' | 'user2'>('user1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load themes
  useEffect(() => {
    api.getThemes(account.id).then(res => {
      setThemes(res.themes);
    }).catch(console.error);
  }, [account.id, account.progress.horrorUnlocked]);

  // Derive roles
  const answererRole = finderRole === 'user1' ? 'user2' : 'user1';
  const finderPlayer = finderRole === 'user1' ? account.player1 : account.player2;
  const answererPlayer = finderRole === 'user1' ? account.player2 : account.player1;

  const handleStart = async () => {
    setError(null);
    setLoading(true);
    sound.playClick?.();

    try {
      const res = await api.createSession({
        accountId: account.id,
        difficulty,
        themeId: selectedThemeId,
        finderPlayerId: finderPlayer.id,
        answererPlayerId: answererPlayer.id
      });

      sound.startAmbient(selectedThemeId);
      onStartSession(res.session);
    } catch (err: any) {
      setError(err.message || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const selectedTheme = themes.find(t => t.id === selectedThemeId) || themes[0];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-pop">
      
      {/* Welcome & Instructions Banner */}
      <div className="bg-gradient-to-r from-[#FFF4D6] via-[#FFE3EC] to-[#E7DFFF] p-6 rounded-3xl border border-purple-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/80 text-purple-700 shadow-2xs">
            Co-Op Expedition Setup
          </span>
          <h2 className="text-2xl font-bold font-heading text-[#3A3A45] mt-1.5">
            Ready to find your best friend, {currentPlayer.name}?
          </h2>
          <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-xl">
            Choose a world theme and assign roles. The <strong className="text-purple-700">Answerer</strong> will privately answer 10 questions about themselves, while the <strong className="text-purple-700">Finder</strong> explores the map and answers MCQs at waypoints to reach them!
          </p>
        </div>
        <div className="text-4xl p-3 bg-white/80 rounded-2xl shadow-sm border border-white">
          🗺️
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-gentle-shake">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Theme Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>1. Choose an Explorable World Theme</span>
            <span className="text-xs font-normal text-slate-500">(Extensible & data-driven)</span>
          </label>
          {account.progress?.horrorUnlocked ? (
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
              <Sparkles size={13} /> Horror Round Unlocked!
            </span>
          ) : (
            <button
              onClick={onDevUnlockHorror}
              className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 underline"
              title="Skip requirement and unlock Horror Round now"
            >
              [Dev Bypass: Unlock Horror Round]
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {themes.map((t) => {
            const isSelected = t.id === selectedThemeId;
            const isLocked = t.isLocked;

            return (
              <div
                key={t.id}
                onClick={() => {
                  if (!isLocked) {
                    setSelectedThemeId(t.id);
                    sound.playClick?.();
                  }
                }}
                className={`relative p-4 rounded-3xl border-2 transition-all cursor-pointer select-none overflow-hidden ${
                  isSelected
                    ? t.isHorror
                      ? 'border-purple-500 bg-slate-900 text-purple-100 shadow-lg scale-[1.02]'
                      : 'border-purple-400 bg-white shadow-md scale-[1.02]'
                    : isLocked
                    ? 'border-slate-200 bg-slate-100/70 opacity-60 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                {/* Theme Motif preview badge */}
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">
                    {t.id === 'nature' && '🌿'}
                    {t.id === 'school' && '🏫'}
                    {t.id === 'cartoon' && '🍭'}
                    {t.id === 'bighouse' && '🏰'}
                    {t.id === 'warfield' && '🧭'}
                    {t.id === 'supermarket' && '🛒'}
                    {t.id === 'horror' && '🕯️'}
                  </span>

                  {isLocked ? (
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1">
                      <Lock size={11} /> Locked
                    </span>
                  ) : isSelected ? (
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">
                      <CheckCircle2 size={14} />
                    </span>
                  ) : null}
                </div>

                <h3 className="font-heading font-bold text-base">
                  {t.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {t.tagline}
                </p>

                {t.isHorror && isLocked && (
                  <div className="mt-2 text-[10px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                    Requires 5 completed rounds (2 Easy, 2 Medium, 1 Hard).
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Difficulty Level */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span>2. Select Exploration Difficulty</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Easy */}
          <div
            onClick={() => { setDifficulty('easy'); sound.playClick?.(); }}
            className={`p-4 rounded-3xl border-2 cursor-pointer transition-all ${
              difficulty === 'easy'
                ? 'border-emerald-400 bg-emerald-50/60 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Easy
              </span>
              <span className="text-xs text-slate-500 font-semibold">10 Hints</span>
            </div>
            <h4 className="font-heading font-bold text-slate-800 text-sm mt-2">
              Linear & Clear Paths
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Waypoints are placed near obvious landmarks with minimal distraction.
            </p>
          </div>

          {/* Medium */}
          <div
            onClick={() => { setDifficulty('medium'); sound.playClick?.(); }}
            className={`p-4 rounded-3xl border-2 cursor-pointer transition-all ${
              difficulty === 'medium'
                ? 'border-sky-400 bg-sky-50/60 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                Medium
              </span>
              <span className="text-xs text-slate-500 font-semibold">5 Hints</span>
            </div>
            <h4 className="font-heading font-bold text-slate-800 text-sm mt-2">
              Branching & Moderate
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Light backtracking, subtle waypoint locations, and simple decoy paths.
            </p>
          </div>

          {/* Hard */}
          <div
            onClick={() => { setDifficulty('hard'); sound.playClick?.(); }}
            className={`p-4 rounded-3xl border-2 cursor-pointer transition-all ${
              difficulty === 'hard'
                ? 'border-purple-400 bg-purple-50/60 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                Hard
              </span>
              <span className="text-xs text-slate-500 font-semibold">3 Hints</span>
            </div>
            <h4 className="font-heading font-bold text-slate-800 text-sm mt-2">
              Multi-Room & Hidden
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Waypoints hidden in far rooms, requires full exploration and keen memory.
            </p>
          </div>

        </div>
      </div>

      {/* 3. Role Assignment */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-slate-800">
          3. Role Assignment for This Round
        </label>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Finder Picker */}
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200">
              <div className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1">
                The In-World Finder 🧭
              </div>
              <p className="text-xs text-slate-600 mb-2">
                Explores the 2D world with avatar, encounters waypoints, and answers MCQs.
              </p>
              <select
                value={finderRole}
                onChange={(e) => setFinderRole(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-purple-300 text-sm font-semibold text-slate-800 focus:outline-none"
              >
                <option value="user1">{account.player1.name} (User 1)</option>
                <option value="user2">{account.player2.name} (User 2)</option>
              </select>
            </div>

            {/* Answerer Picker */}
            <div className="p-3.5 rounded-2xl bg-pink-50/70 border border-pink-200">
              <div className="text-xs font-bold text-pink-700 uppercase tracking-wide mb-1">
                The Truth Answerer 📝
              </div>
              <p className="text-xs text-slate-600 mb-2">
                Answers 10 personal questions first, then watches Finder live on companion radar!
              </p>
              <div className="w-full px-3 py-2 rounded-xl bg-white border border-pink-300 text-sm font-semibold text-slate-800">
                {answererPlayer.name} ({answererRole === 'user1' ? 'User 1' : 'User 2'})
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="pt-2">
        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full py-4 rounded-3xl bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 hover:opacity-95 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Play size={20} className="fill-white" />
          <span>{loading ? 'Launching Expedition...' : `Begin Round in ${selectedTheme.name}`}</span>
        </button>
      </div>

    </div>
  );
};
