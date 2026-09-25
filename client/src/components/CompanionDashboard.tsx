import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, Heart, MessageSquare, Check, X, ShieldAlert, Radio, UserCheck, SplitSquareVertical } from 'lucide-react';
import { Session, Theme } from '../types';
import { wsService } from '../services/websocket';
import { sound } from '../services/audio';

interface CompanionDashboardProps {
  session: Session;
  theme: Theme;
  onOpenChat: () => void;
  onSwitchToFinder?: () => void;
  onToggleSplitView?: () => void;
}

export const CompanionDashboard: React.FC<CompanionDashboardProps> = ({
  session,
  theme,
  onOpenChat,
  onSwitchToFinder,
  onToggleSplitView
}) => {
  const [finderPos, setFinderPos] = useState(session.finderPosition || { x: 300, y: 350, room: 'Entrance', facing: 'right' });
  const [recentAnswers, setRecentAnswers] = useState<any[]>([]);
  const [sentEmote, setSentEmote] = useState<string | null>(null);

  // Listen to live finder movement & question answer events over WS
  useEffect(() => {
    const unsub = wsService.subscribe((data) => {
      if (data.type === 'FINDER_MOVED') {
        setFinderPos(data.finderPosition);
      }
      if (data.type === 'WAYPOINT_ANSWERED') {
        setRecentAnswers(prev => [data, ...prev]);
        if (data.isCorrect) {
          sound.playCorrect();
        } else {
          sound.playIncorrect();
        }
      }
    });
    return unsub;
  }, []);

  const handleSendEmote = (emote: string) => {
    sound.playClick();
    wsService.sendEmote(emote);
    setSentEmote(emote);
    setTimeout(() => setSentEmote(null), 1500);
  };

  const completedWaypoints = session.waypoints.filter(w => w.isAnswered).length;
  const distanceRemaining = Math.max(0, 1000 - completedWaypoints * 100);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-pop">
      
      {/* Live Companion Banner */}
      <div className="bg-gradient-to-r from-[#DFF7EA] via-[#E7DFFF] to-[#FFE3EC] p-6 rounded-3xl border border-purple-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-white/80 px-2.5 py-0.5 rounded-full">
              Live Companion Control Room
            </span>
            {onSwitchToFinder && (
              <button
                type="button"
                onClick={onSwitchToFinder}
                className="text-xs font-bold text-purple-700 bg-purple-100/90 hover:bg-purple-200 px-3 py-1 rounded-full border border-purple-300 transition-colors flex items-center gap-1 shadow-2xs"
                title="Switch to controlling the Explorer in the 2D world"
              >
                <UserCheck size={13} />
                <span>Switch to Finder ({session.finderName})</span>
              </button>
            )}
            {onToggleSplitView && (
              <button
                type="button"
                onClick={onToggleSplitView}
                className="text-xs font-bold text-slate-700 bg-white/90 hover:bg-slate-100 px-3 py-1 rounded-full border border-slate-300 transition-colors flex items-center gap-1 shadow-2xs"
              >
                <SplitSquareVertical size={13} />
                <span>Duo View</span>
              </button>
            )}
          </div>
          <h2 className="text-2xl font-bold font-heading text-[#3A3A45]">
            Watching {session.finderName} Explore!
          </h2>
          <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-lg">
            Your 10 truth answers are locked in! Watch your friend wander through <strong className="text-purple-700">{session.themeName}</strong>, trigger waypoints, and answer MCQs to find you.
          </p>
        </div>

        {/* Live Distance Meter */}
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-purple-200 text-center shadow-xs min-w-[200px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Distance Remaining
          </span>
          <div className="text-2xl font-bold font-heading text-purple-700">
            {distanceRemaining}m
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-400 to-purple-500 h-full transition-all duration-500"
              style={{ width: `${(completedWaypoints / 10) * 100}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block font-medium">
            {completedWaypoints} of 10 waypoints reached
          </span>
        </div>
      </div>

      {/* Grid: Live Radar Tracking & Cheering Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Radar Screen (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-6 text-white border border-purple-200/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio size={18} className="text-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Satellite Compass Radar
              </span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-900/60 text-purple-200 border border-purple-700">
              Location: {finderPos.room || 'Expedition Route'}
            </span>
          </div>

          {/* Graphical Radar Map */}
          <div className="relative w-full h-[320px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
            
            {/* Radar Sweep Animation */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.08)_0%,transparent_70%)] pointer-events-none" />

            {/* Room outlines */}
            {theme.world.rooms.map(r => (
              <div
                key={r.id}
                className="absolute border border-purple-500/20 bg-purple-900/10 rounded-md p-1 text-[9px] text-slate-400 overflow-hidden"
                style={{
                  left: `${(r.x / theme.world.width) * 100}%`,
                  top: `${(r.y / theme.world.height) * 100}%`,
                  width: `${(r.w / theme.world.width) * 100}%`,
                  height: `${(r.h / theme.world.height) * 100}%`
                }}
              >
                {r.name}
              </div>
            ))}

            {/* Waypoints on radar */}
            {session.waypoints.map(wp => (
              <div
                key={wp.index}
                className={`absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[8px] font-bold ${
                  wp.isAnswered
                    ? (wp.isCorrect ? 'bg-emerald-400 text-slate-900' : 'bg-amber-400 text-slate-900')
                    : wp.index === session.currentWaypointIndex
                    ? 'bg-pink-500 text-white animate-pulse'
                    : 'bg-slate-700 text-slate-400'
                }`}
                style={{
                  left: `${(wp.x / theme.world.width) * 100}%`,
                  top: `${(wp.y / theme.world.height) * 100}%`
                }}
              >
                {wp.index + 1}
              </div>
            ))}

            {/* Target Friend Waiting Spot */}
            <div
              className="absolute text-xl -translate-x-1/2 -translate-y-1/2 animate-bounce"
              style={{
                left: `${(session.waypoints[9].x / theme.world.width) * 100}%`,
                top: `${(session.waypoints[9].y / theme.world.height) * 100}%`
              }}
            >
              💖
            </div>

            {/* Finder Avatar Dot with Live coordinates */}
            <div
              className="absolute w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2 transition-all duration-100 flex items-center justify-center text-[9px] font-bold text-slate-900"
              style={{
                left: `${(finderPos.x / theme.world.width) * 100}%`,
                top: `${(finderPos.y / theme.world.height) * 100}%`
              }}
            >
              •
            </div>

          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Coordinates: X {Math.round(finderPos.x)}, Y {Math.round(finderPos.y)}</span>
            <span className="text-emerald-400">Signal: 100% Live</span>
          </div>
        </div>

        {/* Cheering Booster & Chat (1 Col) */}
        <div className="space-y-4">
          
          {/* Quick Emote Cheer Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sparkles size={15} className="text-pink-500" />
              <span>Send Cheering Boosters</span>
            </h3>
            <p className="text-xs text-slate-500">
              Tap an emote to shower your friend's screen with encouraging reactions:
            </p>

            <div className="grid grid-cols-3 gap-2">
              {['❤️', '🙌', '⭐', '✨', '🤗', '🔥'].map((em) => (
                <button
                  key={em}
                  onClick={() => handleSendEmote(em)}
                  className="p-3 rounded-2xl bg-purple-50/70 hover:bg-purple-100 border border-purple-200/80 text-2xl transition-all hover:scale-105 active:scale-95 shadow-2xs"
                >
                  {em}
                </button>
              ))}
            </div>

            {sentEmote && (
              <div className="text-center text-xs font-bold text-purple-700 bg-purple-50 py-1.5 rounded-xl border border-purple-200 animate-pop">
                Sent {sentEmote} to {session.finderName}!
              </div>
            )}
          </div>

          {/* Quick Chat Jump */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <MessageSquare size={15} className="text-purple-500" />
              <span>Live In-Game Chat</span>
            </h3>
            <p className="text-xs text-slate-500">
              Talk or drop subtle hints to your friend in real-time.
            </p>
            <button
              onClick={onOpenChat}
              className="w-full py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs"
            >
              <MessageSquare size={14} />
              <span>Open Chat Channel</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
