import React from 'react';
import { Volume2, VolumeX, MessageSquare, Award, Sparkles, LogOut, Users, SplitSquareVertical } from 'lucide-react';
import { Account, Player } from '../types';
import { sound } from '../services/audio';

interface HeaderProps {
  account: Account | null;
  currentPlayer: Player | null;
  currentRole: 'user1' | 'user2';
  themeName?: string;
  themeMotif?: string;
  isHorror?: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenChat: () => void;
  onOpenJourney: () => void;
  onOpenAvatar: () => void;
  onLogout: () => void;
  onSwitchPlayerRole: () => void;
  onToggleSplitView?: () => void;
  isSplitView?: boolean;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  account,
  currentPlayer,
  currentRole,
  themeName,
  isHorror,
  isMuted,
  onToggleMute,
  onOpenChat,
  onOpenJourney,
  onOpenAvatar,
  onLogout,
  onSwitchPlayerRole,
  onToggleSplitView,
  isSplitView,
  unreadCount = 0
}) => {
  return (
    <header className={`w-full px-4 py-3 border-b transition-colors duration-300 ${
      isHorror 
        ? 'bg-slate-950/90 border-purple-900/40 text-purple-100' 
        : 'bg-white/90 border-slate-200/80 text-[#3A3A45] backdrop-blur-md'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FFE3EC] via-[#E7DFFF] to-[#DCEEFF] flex items-center justify-center text-xl shadow-sm border border-purple-100 animate-float">
            👯
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold font-heading leading-tight flex items-center gap-1.5">
              <span>Find Your Bestfriend</span>
              {themeName && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-sans font-medium ${
                  isHorror 
                    ? 'bg-purple-900/60 text-purple-200 border border-purple-700/50' 
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {themeName}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 font-sans hidden sm:block">
              Two-player cooperative mystery exploration
            </p>
          </div>
        </div>

        {/* Player Profile & Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {account && currentPlayer && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl px-2.5 py-1 text-xs">
              <button 
                onClick={onOpenAvatar}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                title="Customize Avatar"
              >
                <span className="text-base">{currentPlayer.avatar?.emoji || '🌸'}</span>
                <span className="font-semibold text-slate-800">
                  {currentPlayer.name}
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700">
                  {currentRole === 'user1' ? 'User 1' : 'User 2'}
                </span>
              </button>

              <button
                onClick={onSwitchPlayerRole}
                className="p-1 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-white transition-colors"
                title="Switch between User 1 and User 2"
              >
                <Users size={14} />
              </button>
            </div>
          )}

          {/* Dual Split-Screen Toggle */}
          {onToggleSplitView && (
            <button
              onClick={onToggleSplitView}
              className={`p-2 rounded-xl text-xs font-medium border flex items-center gap-1 transition-all ${
                isSplitView 
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
              title="Toggle Duo Split-Screen View (Play both friends on one screen)"
            >
              <SplitSquareVertical size={16} />
              <span className="hidden md:inline">Duo View</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => {
              onToggleMute();
              sound.playClick?.();
            }}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-colors shadow-2xs"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={17} className="text-slate-400" /> : <Volume2 size={17} className="text-emerald-600" />}
          </button>

          {/* Friendship Journey / Stats */}
          {account && (
            <button
              onClick={onOpenJourney}
              className="p-2 rounded-xl bg-gradient-to-tr from-[#FFF4D6] to-[#FFE3EC] hover:brightness-95 border border-amber-200/80 text-amber-900 transition-all flex items-center gap-1.5 shadow-2xs"
              title="Friendship Journey & Achievements"
            >
              <Award size={17} />
              <span className="hidden sm:inline text-xs font-semibold">Journey</span>
              {account.progress?.horrorUnlocked && (
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              )}
            </button>
          )}

          {/* Chat Drawer Toggle */}
          {account && (
            <button
              onClick={onOpenChat}
              className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-colors relative shadow-2xs"
              title="Open Chat"
            >
              <MessageSquare size={17} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Logout */}
          {account && (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 transition-colors"
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
