import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, Heart, Share2, ExternalLink, RefreshCw, Flame, CheckCircle2, Copy, Check } from 'lucide-react';
import { Session, Account } from '../types';
import { sound } from '../services/audio';

interface RewardScreenProps {
  session: Session;
  account: Account;
  onPlayAgain: () => void;
  onSwapRolesAndPlay: () => void;
}

export const RewardScreen: React.FC<RewardScreenProps> = ({
  session,
  account,
  onPlayAgain,
  onSwapRolesAndPlay
}) => {
  const [copiedMeme, setCopiedMeme] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState('👯');

  const reward = session.reward;
  const isWon = session.isWon;

  useEffect(() => {
    sound.playVictory();

    // Confetti shower
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 400);
    } catch (e) {}
  }, []);

  const handleCopyMeme = () => {
    if (!reward) return;
    const text = `👯 ${session.finderName} & ${session.answererName} just conquered "Find Your Bestfriend" in ${session.themeName}! Title: ${reward.title} with a Bond Score of ${session.score}/10! 💖`;
    navigator.clipboard.writeText(text);
    setCopiedMeme(true);
    setTimeout(() => setCopiedMeme(false), 2000);
  };

  const handleCopyCoupon = () => {
    if (!reward?.coupon) return;
    navigator.clipboard.writeText(reward.coupon.code);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  const progress = account.progress;

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-6 space-y-6 animate-pop">
      
      {/* Victory Header Banner */}
      <div className="bg-gradient-to-r from-[#FFF4D6] via-[#FFE3EC] to-[#E7DFFF] p-8 rounded-3xl border border-purple-200/80 shadow-md text-center space-y-3 relative overflow-hidden">
        <div className="w-20 h-20 bg-white/90 shadow-md rounded-3xl mx-auto flex items-center justify-center text-4xl animate-float">
          {isWon ? '🏆' : '💖'}
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/80 text-purple-700 shadow-2xs">
            {isWon ? 'Expedition Complete — Friends Reunited!' : 'A Noble Friendship Quest!'}
          </span>
          <h2 className="text-3xl font-bold font-heading text-[#3A3A45] mt-2">
            {reward?.title || 'Best Friends Forever'}
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
            {session.finderName} successfully tracked down {session.answererName} across the {session.themeName}!
          </p>
        </div>

        {/* Score Badge */}
        <div className="inline-flex items-center gap-2 bg-white/90 px-4 py-2 rounded-2xl border border-purple-200 shadow-2xs text-sm font-bold text-purple-900">
          <Sparkles size={16} className="text-amber-500" />
          <span>Final Bond Accuracy: {session.score} / 10 Correct</span>
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* 1. Friendship Meme & Memory Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Heart size={14} className="text-rose-500" />
                <span>Friendship Memory Card</span>
              </span>
              <span className="text-xl">{selectedSticker}</span>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-tr from-[#FFE3EC] to-[#FFF4D6] border border-pink-200 text-center space-y-2">
              <div className="text-3xl">✨ 👯 ✨</div>
              <h4 className="font-heading font-bold text-slate-800 text-base">
                "{reward?.memeText || 'True best friends know each other by heart.'}"
              </h4>
              <p className="text-xs text-slate-600 font-semibold">
                — Certified by {session.finderName} & {session.answererName}
              </p>
            </div>

            {/* Sticker Decorator */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 mb-1 block">
                Add a memory sticker stamp:
              </span>
              <div className="flex gap-2">
                {['👯', '💖', '⭐', '🍕', '👑', '🌈'].map(st => (
                  <button
                    key={st}
                    onClick={() => setSelectedSticker(st)}
                    className={`p-2 rounded-xl text-lg transition-transform ${
                      selectedSticker === st ? 'bg-purple-100 scale-110' : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleCopyMeme}
            className="w-full py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            {copiedMeme ? <Check size={14} /> : <Share2 size={14} />}
            <span>{copiedMeme ? 'Copied Memory Card Text!' : 'Share Friendship Card'}</span>
          </button>
        </div>

        {/* 2. Free Partner Reward Coupon (§2 & §8) */}
        {reward?.coupon && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Partner Reward Perk
                </span>
                <span className="text-xs text-slate-400 font-medium">Valid {reward.coupon.validDays} Days</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                <h4 className="font-heading font-bold text-slate-800 text-base">
                  {reward.coupon.title}
                </h4>
                <div className="text-xs font-semibold text-emerald-800">
                  Offered by {reward.coupon.provider}
                </div>
                <p className="text-xs text-slate-600">
                  {reward.coupon.description}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">COUPON CODE</span>
                  <code className="font-mono font-bold text-purple-700 text-sm">{reward.coupon.code}</code>
                </div>
                <button
                  onClick={handleCopyCoupon}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-purple-50 text-purple-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                >
                  {copiedCoupon ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedCoupon ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                *External optional partner voucher. No purchase required to continue game.
              </p>
            </div>

            <a
              href="#redeem"
              onClick={(e) => { e.preventDefault(); alert(`Voucher Code ${reward.coupon.code} applied for ${reward.coupon.provider}!`); }}
              className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs"
            >
              <span>Redeem with Bestfriend</span>
              <ExternalLink size={13} />
            </a>
          </div>
        )}

      </div>

      {/* Progression to Horror Round Unlock (§2 Step 6) */}
      <div className={`p-6 rounded-3xl border-2 transition-all ${
        progress.horrorUnlocked 
          ? 'bg-slate-900 border-purple-500 text-purple-100 shadow-lg' 
          : 'bg-white border-slate-200 shadow-2xs'
      }`}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{progress.horrorUnlocked ? '🕯️' : '🔒'}</span>
            <div>
              <h3 className="font-heading font-bold text-base">
                Progression to Horror Round: The Whispering Realm
              </h3>
              <p className="text-xs opacity-75">
                Unlocks after 5 completed rounds (at least 2 Easy, 2 Medium, 1 Hard).
              </p>
            </div>
          </div>

          {progress.horrorUnlocked && (
            <span className="px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm">
              <Sparkles size={13} /> Unlocked & Ready!
            </span>
          )}
        </div>

        {/* Progress Criteria Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          <div className={`p-3 rounded-2xl border text-center text-xs ${
            progress.easy >= 2 ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <span className="block font-bold text-sm">{progress.easy} / 2</span>
            <span>Easy Rounds</span>
          </div>

          <div className={`p-3 rounded-2xl border text-center text-xs ${
            progress.medium >= 2 ? 'bg-sky-50 border-sky-300 text-sky-800' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <span className="block font-bold text-sm">{progress.medium} / 2</span>
            <span>Medium Rounds</span>
          </div>

          <div className={`p-3 rounded-2xl border text-center text-xs ${
            progress.hard >= 1 ? 'bg-purple-50 border-purple-300 text-purple-800' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <span className="block font-bold text-sm">{progress.hard} / 1</span>
            <span>Hard Rounds</span>
          </div>

          <div className={`p-3 rounded-2xl border text-center text-xs ${
            progress.totalCompleted >= 5 ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <span className="block font-bold text-sm">{progress.totalCompleted} / 5</span>
            <span>Total Completed</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          onClick={onPlayAgain}
          className="flex-1 w-full py-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs md:text-sm transition-colors shadow-2xs flex items-center justify-center gap-2"
        >
          <RefreshCw size={16} />
          <span>Play Another Theme</span>
        </button>

        <button
          onClick={onSwapRolesAndPlay}
          className="flex-1 w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 hover:opacity-95 text-white font-bold text-xs md:text-sm transition-opacity shadow-md flex items-center justify-center gap-2"
        >
          <span>Rematch with Swapped Roles!</span>
          <Sparkles size={16} />
        </button>
      </div>

    </div>
  );
};
