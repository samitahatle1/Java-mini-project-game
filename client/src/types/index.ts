// TypeScript definitions for "Find Your Bestfriend"

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface AvatarConfig {
  color: string;
  accent: string;
  hair: 'curly' | 'wavy' | 'straight' | 'short';
  style: 'casual' | 'sporty' | 'cozy' | 'adventurous';
  emoji: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: AvatarConfig;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  unlocked: boolean;
}

export interface RoundHistory {
  id: string;
  theme: string;
  difficulty: DifficultyLevel;
  score: number;
  date: string;
  title: string;
}

export interface AccountProgress {
  easy: number;
  medium: number;
  hard: number;
  horrorUnlocked: boolean;
  totalCompleted: number;
  history: RoundHistory[];
  achievements: Achievement[];
}

export interface Account {
  id: string;
  username: string;
  player1: Player;
  player2: Player;
  progress: AccountProgress;
}

export interface Question {
  id: string;
  category: string;
  categoryIcon: string;
  prompt: string;
  distractors: string[];
}

export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Obstacle {
  type: string;
  x: number;
  y: number;
  r: number;
  label: string;
}

export interface ThemeHud {
  motif: string;
  cardBorder: string;
  accentColor: string;
  secondaryColor: string;
  textColor: string;
  badgeBg: string;
  iconStyle: string;
}

export interface Theme {
  id: string;
  name: string;
  tagline: string;
  isHorror: boolean;
  isLocked?: boolean;
  hud: ThemeHud;
  lighting: {
    vignette: string;
    mood: string;
  };
  world: {
    width: number;
    height: number;
    tileType: string;
    tileColorA: string;
    tileColorB: string;
    pathColor: string;
    ambientParticles: string;
    rooms: Room[];
    obstacles: Obstacle[];
  };
}

export interface Waypoint {
  index: number;
  questionId: string;
  prompt: string;
  category: string;
  categoryIcon: string;
  room: string;
  x: number;
  y: number;
  radius: number;
  isAnswered: boolean;
  isCorrect: boolean | null;
  selectedAnswer: string | null;
  options?: string[];
}

export interface CouponReward {
  id: string;
  title: string;
  provider: string;
  code: string;
  description: string;
  validDays: number;
  accent: string;
}

export interface RewardData {
  isWon: boolean;
  score: number;
  total: number;
  title: string;
  coupon: CouponReward;
  memeText: string;
}

export interface Session {
  id: string;
  accountId: string;
  difficulty: DifficultyLevel;
  themeId: string;
  themeName: string;
  finderPlayerId: string;
  answererPlayerId: string;
  finderName: string;
  answererName: string;
  status: 'answering' | 'exploring' | 'completed';
  questions: Question[];
  truthAnswers?: Record<string, string>;
  waypoints: Waypoint[];
  currentWaypointIndex: number;
  score: number;
  wrongAnswersCount: number;
  hintsRemaining: number;
  createdAt: string;
  isWon: boolean;
  reward: RewardData | null;
  finderPosition: {
    x: number;
    y: number;
    room: string;
    facing: 'left' | 'right' | 'up' | 'down';
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isEmote?: boolean;
}
