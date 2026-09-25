import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { SessionSetup } from './components/SessionSetup';
import { AnswererQuiz } from './components/AnswererQuiz';
import { GameCanvas } from './components/GameCanvas';
import { MCQModal } from './components/MCQModal';
import { CompanionDashboard } from './components/CompanionDashboard';
import { RewardScreen } from './components/RewardScreen';
import { ChatDrawer } from './components/ChatDrawer';
import { FriendshipJourneyModal } from './components/FriendshipJourneyModal';
import { AvatarCustomizerModal } from './components/AvatarCustomizerModal';

import { Account, Player, Session, Theme, Waypoint } from './types';
import { api } from './services/api';
import { sound } from './services/audio';
import { wsService } from './services/websocket';

export function App() {
  // Authentication & Player state
  const [account, setAccount] = useState<Account | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentRole, setCurrentRole] = useState<'user1' | 'user2'>('user1');

  // Game & Session state
  const [session, setSession] = useState<Session | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [activeMCQWaypoint, setActiveMCQWaypoint] = useState<Waypoint | null>(null);

  // Modals & Panels
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isJourneyOpen, setIsJourneyOpen] = useState(false);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [unreadChat, setUnreadChat] = useState(0);

  // Duo View mode for testing / playing both friends concurrently on one screen
  const [isSplitView, setIsSplitView] = useState(false);

  // Load initial demo login or saved session
  useEffect(() => {
    const saved = localStorage.getItem('bff_account');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAccount(parsed.account);
        setCurrentPlayer(parsed.currentPlayer);
        setCurrentRole(parsed.role || 'user1');
      } catch (e) {}
    }
  }, []);

  // Connect WebSocket when session and player are active
  useEffect(() => {
    if (session && currentPlayer) {
      wsService.connect(session.id, currentPlayer.id, currentPlayer.name, currentRole);

      const unsub = wsService.subscribe((data) => {
        if (data.type === 'EXPLORATION_STARTED') {
          setSession(data.session);
        }
        if (data.type === 'WAYPOINT_ANSWERED') {
          setSession(prev => {
            if (!prev) return null;
            const updatedWaypoints = [...prev.waypoints];
            const wp = updatedWaypoints[data.waypointIndex];
            if (wp) {
              wp.isAnswered = true;
              wp.isCorrect = data.isCorrect;
            }
            return {
              ...prev,
              score: data.score,
              currentWaypointIndex: data.currentWaypointIndex,
              hintsRemaining: data.hintsRemaining,
              waypoints: updatedWaypoints
            };
          });
        }
        if (data.type === 'ROUND_COMPLETED') {
          setSession(data.session);
          // Refresh account progress
          if (account) {
            api.getProgress(account.id).then(res => {
              setAccount(prev => prev ? { ...prev, progress: res.progress } : null);
            }).catch(console.error);
          }
        }
        if (data.type === 'CHAT_MESSAGE' && !isChatOpen) {
          setUnreadChat(prev => prev + 1);
        }
      });

      return () => {
        unsub();
        wsService.disconnect();
      };
    }
  }, [session?.id, currentPlayer?.id, currentRole, isChatOpen]);

  // Load Theme details when session changes
  useEffect(() => {
    if (session?.themeId) {
      api.getThemes(account?.id).then(res => {
        const found = res.themes.find(t => t.id === session.themeId) || res.themes[0];
        setTheme(found);
      }).catch(console.error);
    }
  }, [session?.themeId, account?.id]);

  const handleAuthSuccess = (acc: Account, player: Player, role: 'user1' | 'user2') => {
    setAccount(acc);
    setCurrentPlayer(player);
    setCurrentRole(role);
    localStorage.setItem('bff_account', JSON.stringify({ account: acc, currentPlayer: player, role }));
  };

  const handleLogout = () => {
    setAccount(null);
    setCurrentPlayer(null);
    setSession(null);
    localStorage.removeItem('bff_account');
    sound.stopAmbient();
  };

  // Toggle roles between User 1 and User 2
  const handleSwitchPlayerRole = () => {
    if (!account) return;
    const nextRole = currentRole === 'user1' ? 'user2' : 'user1';
    const nextPlayer = nextRole === 'user1' ? account.player1 : account.player2;
    setCurrentRole(nextRole);
    setCurrentPlayer(nextPlayer);
    sound.playClick?.();
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Start Session
  const handleStartSession = (newSession: Session) => {
    setSession(newSession);
  };

  // Answerer submitted truth answers
  const handleAnswersSubmitted = (updatedSession: Session) => {
    setSession(updatedSession);
  };

  // Waypoint triggered in 2D Canvas
  const handleWaypointTrigger = (waypoint: Waypoint) => {
    setActiveMCQWaypoint(waypoint);
  };

  // MCQ Answered callback
  const handleMCQAnswered = (result: { isCorrect: boolean; correctAnswer: string | null; score: number }) => {
    setActiveMCQWaypoint(null);
    if (session) {
      api.getSession(session.id, 'finder').then(res => {
        setSession(res.session);
      });
    }
  };

  // Hint used callback
  const handleHintUsed = (eliminatedOption: string, remaining: number) => {
    if (session) {
      setSession(prev => prev ? { ...prev, hintsRemaining: remaining } : null);
    }
  };

  // Rematch with swapped roles
  const handleSwapRolesAndPlay = async () => {
    if (!account || !session) return;
    try {
      const res = await api.createSession({
        accountId: account.id,
        difficulty: session.difficulty,
        themeId: session.themeId,
        finderPlayerId: session.answererPlayerId, // swapped!
        answererPlayerId: session.finderPlayerId
      });
      setSession(res.session);
    } catch (e) {
      console.error(e);
    }
  };

  // Dev unlock horror round
  const handleDevUnlockHorror = async () => {
    if (!account) return;
    try {
      const res = await api.unlockHorrorDev(account.id);
      setAccount(prev => prev ? { ...prev, progress: res.progress } : null);
      sound.playVictory();
    } catch (e) {
      console.error(e);
    }
  };

  // Quick 1-click auto fill to jump directly into the 2D world
  const handleQuickAutoFill = async () => {
    if (!session) return;
    try {
      const payload = session.questions.map((q, idx) => ({
        questionId: q.id,
        answerText: q.distractors[0] || `Favorite ${idx}`
      }));
      const res = await api.submitTruthAnswers(session.id, payload);
      sound.playCorrect();
      setSession(res.session);
    } catch (e) {
      console.error(e);
    }
  };

  // Determine if viewing player is Finder or Answerer
  const isFinder = session && currentPlayer ? session.finderPlayerId === currentPlayer.id : true;
  const isAnswerer = !isFinder;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#3A3A45]">
      
      {/* Header */}
      <Header
        account={account}
        currentPlayer={currentPlayer}
        currentRole={currentRole}
        themeName={session ? session.themeName : undefined}
        isHorror={theme?.isHorror}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenChat={() => { setIsChatOpen(true); setUnreadChat(0); }}
        onOpenJourney={() => setIsJourneyOpen(true)}
        onOpenAvatar={() => setIsAvatarOpen(true)}
        onLogout={handleLogout}
        onSwitchPlayerRole={handleSwitchPlayerRole}
        onToggleSplitView={() => setIsSplitView(prev => !prev)}
        isSplitView={isSplitView}
        unreadCount={unreadChat}
      />

      {/* Main Body Flow */}
      <main className="flex-1 flex flex-col justify-center items-center p-3 md:p-6 w-full max-w-7xl mx-auto">
        
        {/* Step 1: Shared Auth Modal */}
        {!account && (
          <AuthModal onSuccess={handleAuthSuccess} />
        )}

        {/* Step 2: Session Setup */}
        {account && (!session || session.status === 'completed' && !session.reward) && (
          <SessionSetup
            account={account}
            currentPlayer={currentPlayer!}
            currentRole={currentRole}
            onStartSession={handleStartSession}
            onDevUnlockHorror={handleDevUnlockHorror}
          />
        )}

        {/* Step 3: Answering Phase (10 Questions Deck) */}
        {account && session && session.status === 'answering' && (
          <AnswererQuiz
            session={session}
            isCurrentAnswerer={isAnswerer}
            onAnswersSubmitted={handleAnswersSubmitted}
            onSwitchToAnswerer={handleSwitchPlayerRole}
            onToggleSplitView={() => setIsSplitView(prev => !prev)}
            onQuickAutoFill={handleQuickAutoFill}
          />
        )}

        {/* Step 4: Exploring Phase (Exploration or Live Companion) */}
        {account && session && session.status === 'exploring' && theme && (
          <>
            {isSplitView ? (
              /* Duo Split-Screen View: Shows both Finder 2D Canvas & Companion Radar! */
              <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-6 animate-pop">
                <div>
                  <div className="text-xs font-bold text-purple-700 bg-purple-50 p-2 rounded-xl mb-2 flex items-center justify-between border border-purple-200">
                    <span>🧭 Finder View: {session.finderName}</span>
                    <span className="text-[10px] text-slate-500">WASD / Arrow Keys to Move</span>
                  </div>
                  <GameCanvas
                    theme={theme}
                    waypoints={session.waypoints}
                    currentWaypointIndex={session.currentWaypointIndex}
                    player={account.player1.id === session.finderPlayerId ? account.player1 : account.player2}
                    onWaypointTrigger={handleWaypointTrigger}
                    isFinder={true}
                    hintsRemaining={session.hintsRemaining}
                    score={session.score}
                  />
                </div>

                <div>
                  <div className="text-xs font-bold text-pink-700 bg-pink-50 p-2 rounded-xl mb-2 flex items-center justify-between border border-pink-200">
                    <span>📝 Answerer Companion: {session.answererName}</span>
                    <span className="text-[10px] text-slate-500">Live Satellite Radar</span>
                  </div>
                  <CompanionDashboard
                    session={session}
                    theme={theme}
                    onOpenChat={() => setIsChatOpen(true)}
                  />
                </div>
              </div>
            ) : isFinder ? (
              /* Single View: Finder's 2D World Exploration */
              <div className="w-full max-w-5xl space-y-4 animate-pop">
                <GameCanvas
                  theme={theme}
                  waypoints={session.waypoints}
                  currentWaypointIndex={session.currentWaypointIndex}
                  player={currentPlayer!}
                  onWaypointTrigger={handleWaypointTrigger}
                  isFinder={true}
                  hintsRemaining={session.hintsRemaining}
                  score={session.score}
                />
              </div>
            ) : (
              /* Single View: Answerer's Live Companion Dashboard */
              <CompanionDashboard
                session={session}
                theme={theme}
                onOpenChat={() => setIsChatOpen(true)}
                onSwitchToFinder={handleSwitchPlayerRole}
                onToggleSplitView={() => setIsSplitView(prev => !prev)}
              />
            )}

            {/* MCQ Modal Overlay (triggers when Finder reaches active waypoint) */}
            {activeMCQWaypoint && (
              <MCQModal
                sessionId={session.id}
                waypoint={activeMCQWaypoint}
                theme={theme}
                hintsRemaining={session.hintsRemaining}
                onAnswered={handleMCQAnswered}
                onHintUsed={handleHintUsed}
                onClose={() => setActiveMCQWaypoint(null)}
              />
            )}
          </>
        )}

        {/* Step 5 & 6: Round Completed Rewards & Progression */}
        {account && session && session.status === 'completed' && session.reward && (
          <RewardScreen
            session={session}
            account={account}
            onPlayAgain={() => setSession(null)}
            onSwapRolesAndPlay={handleSwapRolesAndPlay}
          />
        )}

      </main>

      {/* Live In-Game Chat Drawer */}
      {account && currentPlayer && (
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          currentPlayer={currentPlayer}
        />
      )}

      {/* Friendship Journey & Horror Unlock Stats Modal */}
      {account && (
        <FriendshipJourneyModal
          isOpen={isJourneyOpen}
          onClose={() => setIsJourneyOpen(false)}
          account={account}
          onRefreshAccount={(acc) => setAccount(acc)}
        />
      )}

      {/* Avatar Customizer Modal */}
      {account && currentPlayer && (
        <AvatarCustomizerModal
          isOpen={isAvatarOpen}
          onClose={() => setIsAvatarOpen(false)}
          account={account}
          currentPlayer={currentPlayer}
          currentRole={currentRole}
          onUpdatePlayer={(p) => {
            setCurrentPlayer(p);
            setAccount(prev => {
              if (!prev) return null;
              return {
                ...prev,
                player1: currentRole === 'user1' ? p : prev.player1,
                player2: currentRole === 'user2' ? p : prev.player2
              };
            });
          }}
        />
      )}

    </div>
  );
}

export default App;
