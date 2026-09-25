import { Account, Session, Theme, DifficultyLevel, AvatarConfig } from '../types';

const API_BASE = '/api';

export const api = {
  async healthCheck() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async register(player1Name: string, player2Name: string, password: string):Promise<{ message: string; account: Account }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player1Name, player2Name, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to register account');
    }
    return res.json();
  },

  async login(username: string, password: string, playerRole: 'user1' | 'user2') {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, playerRole })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to login');
    }
    return res.json();
  },

  async getDemo() {
    const res = await fetch(`${API_BASE}/auth/demo`);
    return res.json();
  },

  async getThemes(accountId?: string): Promise<{ themes: Theme[]; horrorUnlocked: boolean }> {
    const url = accountId ? `${API_BASE}/themes?accountId=${accountId}` : `${API_BASE}/themes`;
    const res = await fetch(url);
    return res.json();
  },

  async createSession(params: {
    accountId: string;
    difficulty: DifficultyLevel;
    themeId: string;
    finderPlayerId: string;
    answererPlayerId: string;
  }): Promise<{ session: Session }> {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create game session');
    }
    return res.json();
  },

  async getSession(id: string, role: 'finder' | 'answerer' = 'finder'): Promise<{ session: Session }> {
    const res = await fetch(`${API_BASE}/sessions/${id}?role=${role}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch session');
    }
    return res.json();
  },

  async submitTruthAnswers(sessionId: string, answers: { questionId: string; answerText: string }[]): Promise<{ session: Session }> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit answers');
    }
    return res.json();
  },

  async submitWaypointAnswer(sessionId: string, waypointIndex: number, selectedAnswer: string) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waypointIndex, selectedAnswer })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit answer');
    }
    return res.json();
  },

  async useHint(sessionId: string, waypointIndex: number) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/hint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waypointIndex })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to use hint');
    }
    return res.json();
  },

  async updatePosition(sessionId: string, pos: { x: number; y: number; room: string; facing: string }) {
    return fetch(`${API_BASE}/sessions/${sessionId}/position`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pos)
    });
  },

  async getProgress(accountId: string) {
    const res = await fetch(`${API_BASE}/users/${accountId}/progress`);
    return res.json();
  },

  async unlockHorrorDev(accountId: string) {
    const res = await fetch(`${API_BASE}/users/${accountId}/progress/unlock-horror-dev`, {
      method: 'POST'
    });
    return res.json();
  },

  async updateAvatar(accountId: string, playerRole: 'user1' | 'user2', avatar: Partial<AvatarConfig>) {
    const res = await fetch(`${API_BASE}/users/${accountId}/avatar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, playerRole, avatar })
    });
    return res.json();
  },

  async getCoupons() {
    const res = await fetch(`${API_BASE}/coupons`);
    return res.json();
  }
};
