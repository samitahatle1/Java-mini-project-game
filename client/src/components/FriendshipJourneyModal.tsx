import React from 'react';
import { X, Award, Sparkles, CheckCircle2, Lock, Flame, Calendar, Trophy, ChevronRight } from 'lucide-react';
import { Account } from '../types';
import { api } from '../services/api';

interface FriendshipJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
  onRefreshAccount: (acc: Account) => void;
}

export const FriendshipJourneyModal: React.FC<FriendshipJourneyModalProps> = ({
  isOpen,
  onClose,
  account,
  onRefreshAccount
}) => {
  if (!isOpen) return null;

  const progress = account.progress;

  const handleDevUnlock = async () => {
    try {
      const res = await api.unlockHorrorDev(account.id);
      onRefreshAccount({
        ...account,
        progress: res.progress
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-pop">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-purple-100 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-[#FFF4D6] via-[#FFE3EC] to-[#E7DFFF] border-b border-purple-100/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/90 shadow-sm flex items-center justify-center text-2xl">
              🏆
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-[#3A3A45]">
                Friendship Journey Tracker
              </h2>
              <p className="text-xs text-slate-600">
                Shared chronicle of {account.player1.name} & {account.player2.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* 1. Overview Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Easy Cleared</span>
              <span className="text-xl font-bold text-emerald-900 font-heading">{progress.easy}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">Medium Cleared</span>
              <span className="text-xl font-bold text-sky-900 font-heading">{progress.medium}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">Hard Cleared</span>
              <span className="text-xl font-bold text-purple-900 font-heading">{progress.hard}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Total Expeditions</span>
              <span className="text-xl font-bold text-amber-900 font-heading">{progress.totalCompleted}</span>
            </div>
          </div>

          {/* 2. Horror Round Unlock Status (§2 Step 6) */}
          <div className={`p-5 rounded-3xl border-2 transition-all ${
            progress.horrorUnlocked 
              ? 'bg-slate-900 border-purple-500 text-purple-100' 
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{progress.horrorUnlocked ? '🕯️' : '🔒'}</span>
                <div>
                  <h3 className="font-heading font-bold text-base">
                    Horror Round: The Whispering Realm
                  </h3>
                  <p className="text-xs opacity-75">
                    Requires 5 total completed rounds: at least 2 Easy, 2 Medium, and 1 Hard.
                  </p>
                </div>
              </div>

              {progress.horrorUnlocked ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Unlocked
                </span>
              ) : (
                <button
                  onClick={handleDevUnlock}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors"
                >
                  Dev: Unlock Now ⚡
                </button>
              )}
            </div>

            {/* Checklist */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span>At least 2 Easy Rounds:</span>
                <span className="font-bold">{progress.easy >= 2 ? '✅ Done' : `${progress.easy}/2`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>At least 2 Medium Rounds:</span>
                <span className="font-bold">{progress.medium >= 2 ? '✅ Done' : `${progress.medium}/2`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>At least 1 Hard Round:</span>
                <span className="font-bold">{progress.hard >= 1 ? '✅ Done' : `${progress.hard}/1`}</span>
              </div>
            </div>
          </div>

          {/* 3. Achievements Pool (§7) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Award size={16} className="text-purple-600" />
              <span>Duo Achievements</span>
            </h3>

            <div className="space-y-2">
              {progress.achievements?.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                    ach.unlocked
                      ? 'bg-purple-50/70 border-purple-200 text-purple-950'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{ach.unlocked ? '🌟' : '🔒'}</span>
                    <div>
                      <h4 className="font-bold text-xs">{ach.name}</h4>
                      <p className="text-[11px] opacity-80">{ach.desc}</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200">
                    {ach.unlocked ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Expedition History */}
          {progress.history && progress.history.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar size={15} className="text-slate-500" />
                <span>Recent Friendship Expeditions</span>
              </h3>

              <div className="space-y-2">
                {progress.history.slice(0, 5).map((h, i) => (
                  <div
                    key={h.id || i}
                    className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 capitalize">{h.theme} Theme ({h.difficulty})</span>
                      <span className="text-slate-400 ml-2 font-medium">• {h.date}</span>
                    </div>
                    <div className="font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-100">
                      Score: {h.score}/10
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
