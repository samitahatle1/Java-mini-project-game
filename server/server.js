import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { QUESTION_BANK, getRandomQuestions } from './questions.js';
import { THEMES, getThemeById, generateThemeWaypoints } from './themes.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../client/dist');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(distPath));

// In-memory persistent state
const accounts = new Map();
const sessions = new Map();
const socketSessions = new Map(); // sessionId -> Set of WebSocket clients

// Seed demo account for zero-friction testing
const demoAccountId = 'acc_demo_besties';
accounts.set(demoAccountId, {
  id: demoAccountId,
  username: 'alex_and_jordan',
  password: 'bff',
  player1: {
    id: 'p1_alex',
    name: 'Alex',
    avatar: {
      color: '#FFE3EC',
      accent: '#FF80A0',
      hair: 'curly',
      style: 'casual',
      emoji: '🌸'
    }
  },
  player2: {
    id: 'p2_jordan',
    name: 'Jordan',
    avatar: {
      color: '#DCEEFF',
      accent: '#6BA4FF',
      hair: 'wavy',
      style: 'sporty',
      emoji: '⭐'
    }
  },
  progress: {
    easy: 2,
    medium: 2,
    hard: 0,
    horrorUnlocked: false,
    totalCompleted: 4,
    history: [
      { id: 'hist_1', theme: 'nature', difficulty: 'easy', score: 9, date: 'Yesterday', title: 'Soulmate Explorers' },
      { id: 'hist_2', theme: 'school', difficulty: 'easy', score: 8, date: '2 days ago', title: 'Study Hall Duo' },
      { id: 'hist_3', theme: 'cartoon', difficulty: 'medium', score: 7, date: '3 days ago', title: 'Candy Kingdom Champions' },
      { id: 'hist_4', theme: 'bighouse', difficulty: 'medium', score: 8, date: '4 days ago', title: 'Mansion Detectives' }
    ],
    achievements: [
      { id: 'first_bond', name: 'First Connection', desc: 'Completed your very first round together', unlocked: true },
      { id: 'telepathic', name: 'Mind Readers', desc: 'Scored 8 or higher in a single round', unlocked: true },
      { id: 'horror_ready', name: 'Courage Required', desc: 'Reach 5 completed rounds to enter the Whispering Realm', unlocked: false }
    ]
  }
});

// Partner reward coupon pool per §8
const REWARD_COUPONS = [
  {
    id: 'coupon_boba',
    title: '50% Off Boba for Two',
    provider: 'Sweet Pearl Tea Bar',
    code: 'BESTIE-BOBA-50',
    description: 'Buy one signature brown sugar or taro milk tea, get the second half-off for your best friend.',
    validDays: 14,
    accent: '#FFE3EC'
  },
  {
    id: 'coupon_game',
    title: 'Free Co-Op Gaming Pass',
    provider: 'Arcade Odyssey Club',
    code: 'DUO-GAME-PASS',
    description: '2 hours of complimentary co-op arcade and virtual reality gaming session for two.',
    validDays: 30,
    accent: '#E7DFFF'
  },
  {
    id: 'coupon_coffee',
    title: 'Buy One Get One Artisan Latte',
    provider: 'Golden Hour Roasters',
    code: 'SUNNY-LATTE-BOGO',
    description: 'Enjoy two handcrafted oat or lavender honey lattes for the price of one.',
    validDays: 7,
    accent: '#FFF4D6'
  },
  {
    id: 'coupon_icecream',
    title: 'Double Scoop Friendship Treat',
    provider: 'Pastel Gelateria',
    code: 'SWEET-PAIR-2X',
    description: 'Complimentary waffle cone upgrade and artisanal topping on any double scoop order.',
    validDays: 21,
    accent: '#DFF7EA'
  }
];

// Helper: Check horror unlock requirement (5 rounds: 2 easy, 2 med, 1 hard)
function evaluateHorrorUnlock(progress) {
  const meetsCriteria = progress.easy >= 2 && progress.medium >= 2 && progress.hard >= 1 && progress.totalCompleted >= 5;
  if (meetsCriteria) {
    progress.horrorUnlocked = true;
    const ach = progress.achievements.find(a => a.id === 'horror_ready');
    if (ach) ach.unlocked = true;
  }
  return progress.horrorUnlocked;
}

// ----------------- REST ROUTES -----------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'Find Your Bestfriend API', timestamp: new Date().toISOString() });
});

// 1. Shared Registration
app.post('/api/auth/register', (req, res) => {
  const { player1Name, player2Name, password } = req.body;
  if (!player1Name || !player2Name || !password) {
    return res.status(400).json({ error: 'Player 1 name, Player 2 name, and password are required' });
  }

  const cleanP1 = player1Name.trim().slice(0, 20);
  const cleanP2 = player2Name.trim().slice(0, 20);
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const username = `${cleanP1.toLowerCase().replace(/[^a-z0-9]/g, '')}_${cleanP2.toLowerCase().replace(/[^a-z0-9]/g, '')}_${randNum}`;
  const accountId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newAccount = {
    id: accountId,
    username,
    password,
    player1: {
      id: `p1_${Date.now()}`,
      name: cleanP1,
      avatar: {
        color: '#FFE3EC',
        accent: '#FF80A0',
        hair: 'curly',
        style: 'casual',
        emoji: '🌸'
      }
    },
    player2: {
      id: `p2_${Date.now()}`,
      name: cleanP2,
      avatar: {
        color: '#DCEEFF',
        accent: '#6BA4FF',
        hair: 'wavy',
        style: 'sporty',
        emoji: '⭐'
      }
    },
    progress: {
      easy: 0,
      medium: 0,
      hard: 0,
      horrorUnlocked: false,
      totalCompleted: 0,
      history: [],
      achievements: [
        { id: 'first_bond', name: 'First Connection', desc: 'Completed your very first round together', unlocked: false },
        { id: 'telepathic', name: 'Mind Readers', desc: 'Scored 8 or higher in a single round', unlocked: false },
        { id: 'horror_ready', name: 'Courage Required', desc: 'Reach 5 completed rounds to enter the Whispering Realm', unlocked: false }
      ]
    }
  };

  accounts.set(accountId, newAccount);
  // Also index by username for easy lookup
  accounts.set(username, newAccount);

  res.status(201).json({
    message: 'Bestfriend account created successfully!',
    account: {
      id: newAccount.id,
      username: newAccount.username,
      player1: newAccount.player1,
      player2: newAccount.player2,
      progress: newAccount.progress
    }
  });
});

// 2. Shared Login
app.post('/api/auth/login', (req, res) => {
  const { username, password, playerRole } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Lookup account
  let account = null;
  for (const acc of accounts.values()) {
    if (acc.username === username.trim() || acc.id === username.trim()) {
      account = acc;
      break;
    }
  }

  if (!account || account.password !== password) {
    return res.status(401).json({ error: 'Invalid bestfriend username or password' });
  }

  const selectedRole = playerRole === 'user2' ? 'user2' : 'user1';
  const currentPlayer = selectedRole === 'user2' ? account.player2 : account.player1;

  res.json({
    token: `token_${account.id}_${selectedRole}_${Date.now()}`,
    account: {
      id: account.id,
      username: account.username,
      player1: account.player1,
      player2: account.player2,
      progress: account.progress
    },
    currentPlayer,
    role: selectedRole
  });
});

// 3. Demo Login
app.get('/api/auth/demo', (req, res) => {
  const demo = accounts.get(demoAccountId);
  res.json({
    account: {
      id: demo.id,
      username: demo.username,
      player1: demo.player1,
      player2: demo.player2,
      progress: demo.progress
    },
    password: demo.password
  });
});

// 4. Update Avatar
app.post('/api/users/:id/avatar', (req, res) => {
  const { accountId, playerRole, avatar } = req.body;
  const account = accounts.get(accountId);
  if (!account) return res.status(404).json({ error: 'Account not found' });

  if (playerRole === 'user2') {
    account.player2.avatar = { ...account.player2.avatar, ...avatar };
  } else {
    account.player1.avatar = { ...account.player1.avatar, ...avatar };
  }

  res.json({ success: true, account });
});

// 5. Get Themes
app.get('/api/themes', (req, res) => {
  const accountId = req.query.accountId;
  let horrorUnlocked = false;
  if (accountId && accounts.has(accountId)) {
    horrorUnlocked = accounts.get(accountId).progress.horrorUnlocked;
  }

  const themesWithLockStatus = THEMES.map(t => ({
    ...t,
    isLocked: t.isHorror ? !horrorUnlocked : false
  }));

  res.json({ themes: themesWithLockStatus, horrorUnlocked });
});

// 6. Create Session
app.post('/api/sessions', (req, res) => {
  const { accountId, difficulty = 'easy', themeId = 'nature', finderPlayerId, answererPlayerId } = req.body;
  const account = accounts.get(accountId);
  if (!account) return res.status(404).json({ error: 'Account not found' });

  // Check horror round qualification if horror chosen
  if (themeId === 'horror' && !account.progress.horrorUnlocked) {
    return res.status(403).json({ error: 'The Whispering Realm requires 5 completed rounds (2 Easy, 2 Medium, 1 Hard).' });
  }

  const sessionId = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const questions = getRandomQuestions(10);
  const waypoints = generateThemeWaypoints(themeId, difficulty, questions);
  const theme = getThemeById(themeId);

  const initialHintTokens = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 5 : 3;

  const session = {
    id: sessionId,
    accountId,
    difficulty,
    themeId,
    themeName: theme.name,
    finderPlayerId: finderPlayerId || account.player1.id,
    answererPlayerId: answererPlayerId || account.player2.id,
    finderName: finderPlayerId === account.player2.id ? account.player2.name : account.player1.name,
    answererName: answererPlayerId === account.player1.id ? account.player1.name : account.player2.name,
    status: 'answering', // 'answering' -> 'exploring' -> 'completed'
    questions,
    truthAnswers: {}, // questionId -> answerText (private until answered)
    waypoints,
    currentWaypointIndex: 0,
    score: 0,
    wrongAnswersCount: 0,
    hintsRemaining: initialHintTokens,
    createdAt: new Date().toISOString(),
    isWon: false,
    reward: null,
    finderPosition: { x: 300, y: 350, room: theme.world.rooms[0].name, facing: 'right' }
  };

  sessions.set(sessionId, session);

  broadcastToSession(sessionId, {
    type: 'SESSION_CREATED',
    session: sanitizeSessionForClient(session, 'all')
  });

  res.status(201).json({ session: sanitizeSessionForClient(session, 'all') });
});

// 7. Get Session
app.get('/api/sessions/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const role = req.query.role || 'finder';
  res.json({ session: sanitizeSessionForClient(session, role) });
});

// 8. Answerer submits their 10 truth answers
app.post('/api/sessions/:id/answers', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.status !== 'answering') {
    return res.status(400).json({ error: 'Answers have already been submitted for this session.' });
  }

  const { answers } = req.body; // array of { questionId, answerText }
  if (!Array.isArray(answers) || answers.length < 10) {
    return res.status(400).json({ error: 'Must provide answers for all 10 questions.' });
  }

  // Store truth answers
  answers.forEach(({ questionId, answerText }) => {
    session.truthAnswers[questionId] = answerText;
  });

  // Prepare MCQ options for each waypoint
  session.waypoints.forEach((wp, idx) => {
    const question = session.questions[idx];
    const correctAnswer = session.truthAnswers[question.id];
    
    // Pick 3 distractors from question's distractor pool (filtering out correct answer if same)
    const availableDistractors = (question.distractors || []).filter(d => d.toLowerCase() !== correctAnswer.toLowerCase());
    const shuffledDistractors = [...availableDistractors].sort(() => 0.5 - Math.random()).slice(0, 3);
    
    // Combine correct + 3 distractors and shuffle
    const options = [correctAnswer, ...shuffledDistractors].sort(() => 0.5 - Math.random());
    wp.options = options;
  });

  session.status = 'exploring';

  broadcastToSession(session.id, {
    type: 'EXPLORATION_STARTED',
    session: sanitizeSessionForClient(session, 'all')
  });

  res.json({ message: 'Truth set recorded! Exploration phase is now live.', session: sanitizeSessionForClient(session, 'answerer') });
});

// 9. Finder submits answer for current waypoint
app.post('/api/sessions/:id/submit', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.status !== 'exploring') {
    return res.status(400).json({ error: 'Session is not in exploration phase.' });
  }

  const { waypointIndex, selectedAnswer } = req.body;
  const waypoint = session.waypoints[waypointIndex];
  if (!waypoint) return res.status(400).json({ error: 'Invalid waypoint index' });

  const question = session.questions[waypointIndex];
  const correctAnswer = session.truthAnswers[question.id];
  const isCorrect = selectedAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

  waypoint.isAnswered = true;
  waypoint.isCorrect = isCorrect;
  waypoint.selectedAnswer = selectedAnswer;

  if (isCorrect) {
    session.score += 1;
  } else {
    session.wrongAnswersCount += 1;
    // Gentle setback: deduct 1 hint token if available, never punish harshly
    if (session.hintsRemaining > 0) {
      session.hintsRemaining -= 1;
    }
  }

  // Advance index if answered
  if (session.currentWaypointIndex === waypointIndex && session.currentWaypointIndex < session.waypoints.length - 1) {
    session.currentWaypointIndex += 1;
  }

  // Check completion: all 10 waypoints answered
  const allAnswered = session.waypoints.every(wp => wp.isAnswered);
  if (allAnswered) {
    session.status = 'completed';
    session.isWon = session.score >= 6; // §2: Reaching 6/10 correct = round won

    // Award random partner coupon & friendship card
    const randomCoupon = REWARD_COUPONS[Math.floor(Math.random() * REWARD_COUPONS.length)];
    const titles = ['Soul Twins', 'Telepathic Duo', 'Dynamic Legends', 'Inseparable Pair', 'Mind Reading Masters'];
    const assignedTitle = titles[Math.floor(Math.random() * titles.length)];

    session.reward = {
      isWon: session.isWon,
      score: session.score,
      total: 10,
      title: assignedTitle,
      coupon: randomCoupon,
      memeText: session.isWon 
        ? `Confirmed by science: You know your bestfriend better than they know themselves! (${session.score}/10)` 
        : `A legendary effort! True best friends are always learning something new about each other. (${session.score}/10)`
    };

    // Update account progress if won
    const account = accounts.get(session.accountId);
    if (account && session.isWon) {
      if (session.difficulty === 'easy') account.progress.easy += 1;
      if (session.difficulty === 'medium') account.progress.medium += 1;
      if (session.difficulty === 'hard') account.progress.hard += 1;
      account.progress.totalCompleted += 1;

      // Check achievements
      const firstAch = account.progress.achievements.find(a => a.id === 'first_bond');
      if (firstAch) firstAch.unlocked = true;
      if (session.score >= 8) {
        const teleAch = account.progress.achievements.find(a => a.id === 'telepathic');
        if (teleAch) teleAch.unlocked = true;
      }

      // Check Horror unlock
      evaluateHorrorUnlock(account.progress);

      account.progress.history.unshift({
        id: `hist_${Date.now()}`,
        theme: session.themeId,
        difficulty: session.difficulty,
        score: session.score,
        date: 'Just now',
        title: assignedTitle
      });
    }

    broadcastToSession(session.id, {
      type: 'ROUND_COMPLETED',
      reward: session.reward,
      session: sanitizeSessionForClient(session, 'all')
    });
  } else {
    broadcastToSession(session.id, {
      type: 'WAYPOINT_ANSWERED',
      waypointIndex,
      isCorrect,
      correctAnswer: isCorrect ? null : correctAnswer,
      score: session.score,
      currentWaypointIndex: session.currentWaypointIndex,
      hintsRemaining: session.hintsRemaining
    });
  }

  res.json({
    isCorrect,
    correctAnswer,
    score: session.score,
    currentWaypointIndex: session.currentWaypointIndex,
    isCompleted: session.status === 'completed',
    isWon: session.isWon,
    reward: session.reward
  });
});

// 10. Use a Hint
app.post('/api/sessions/:id/hint', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.hintsRemaining <= 0) {
    return res.status(400).json({ error: 'No hint tokens remaining.' });
  }

  const { waypointIndex } = req.body;
  const waypoint = session.waypoints[waypointIndex];
  if (!waypoint || !waypoint.options) return res.status(400).json({ error: 'Invalid waypoint' });

  const question = session.questions[waypointIndex];
  const correctAnswer = session.truthAnswers[question.id];

  // Eliminate one wrong option
  const wrongOptions = waypoint.options.filter(opt => opt.toLowerCase() !== correctAnswer.toLowerCase());
  const eliminatedOption = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];

  session.hintsRemaining -= 1;

  broadcastToSession(session.id, {
    type: 'HINT_USED',
    waypointIndex,
    eliminatedOption,
    hintsRemaining: session.hintsRemaining
  });

  res.json({ eliminatedOption, hintsRemaining: session.hintsRemaining });
});

// 11. Finder Live Position Updates
app.post('/api/sessions/:id/position', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const { x, y, room, facing } = req.body;
  session.finderPosition = { x, y, room, facing };

  broadcastToSession(session.id, {
    type: 'FINDER_MOVED',
    finderPosition: session.finderPosition
  });

  res.json({ ok: true });
});

// 12. Account Progress & Stats
app.get('/api/users/:id/progress', (req, res) => {
  const account = accounts.get(req.params.id);
  if (!account) return res.status(404).json({ error: 'Account not found' });

  evaluateHorrorUnlock(account.progress);
  res.json({ progress: account.progress });
});

// 13. Dev bypass to unlock horror round directly
app.post('/api/users/:id/progress/unlock-horror-dev', (req, res) => {
  const account = accounts.get(req.params.id);
  if (!account) return res.status(404).json({ error: 'Account not found' });

  account.progress.horrorUnlocked = true;
  account.progress.easy = Math.max(account.progress.easy, 2);
  account.progress.medium = Math.max(account.progress.medium, 2);
  account.progress.hard = Math.max(account.progress.hard, 1);
  account.progress.totalCompleted = Math.max(account.progress.totalCompleted, 5);

  const ach = account.progress.achievements.find(a => a.id === 'horror_ready');
  if (ach) ach.unlocked = true;

  res.json({ success: true, progress: account.progress });
});

// 14. Partner Coupons
app.get('/api/coupons', (req, res) => {
  res.json({ coupons: REWARD_COUPONS });
});

// Helper: Sanitize session state for client view
function sanitizeSessionForClient(session, viewerRole) {
  const clone = JSON.parse(JSON.stringify(session));
  
  // If viewer is Finder and round is still exploring, hide remaining truth answers
  if (viewerRole === 'finder' && clone.status === 'exploring') {
    delete clone.truthAnswers;
  }
  
  return clone;
}

// ----------------- WEBSOCKET SERVER -----------------

const server = createServer(app);
const wss = new WebSocketServer({ server });

function broadcastToSession(sessionId, data) {
  const clients = socketSessions.get(sessionId);
  if (!clients) return;

  const payload = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

wss.on('connection', (ws, req) => {
  let currentSessionId = null;
  let currentUserId = null;

  ws.on('message', (messageRaw) => {
    try {
      const data = JSON.parse(messageRaw.toString());

      if (data.type === 'JOIN_SESSION') {
        currentSessionId = data.sessionId;
        currentUserId = data.userId;

        if (!socketSessions.has(currentSessionId)) {
          socketSessions.set(currentSessionId, new Set());
        }
        socketSessions.get(currentSessionId).add(ws);

        // Notify session members of presence
        broadcastToSession(currentSessionId, {
          type: 'PLAYER_JOINED',
          userId: currentUserId,
          userName: data.userName,
          role: data.role,
          timestamp: Date.now()
        });
      }

      if (data.type === 'CHAT_MESSAGE') {
        broadcastToSession(currentSessionId, {
          type: 'CHAT_MESSAGE',
          senderId: currentUserId,
          senderName: data.senderName,
          text: data.text,
          timestamp: Date.now()
        });
      }

      if (data.type === 'SEND_EMOTE') {
        broadcastToSession(currentSessionId, {
          type: 'EMOTE_RECEIVED',
          senderId: currentUserId,
          senderName: data.senderName,
          emote: data.emote,
          timestamp: Date.now()
        });
      }

      if (data.type === 'ANSWERER_TYPING') {
        broadcastToSession(currentSessionId, {
          type: 'ANSWERER_TYPING',
          currentQuestionIndex: data.currentQuestionIndex,
          totalQuestions: 10
        });
      }

      if (data.type === 'FINDER_MOVE') {
        const session = sessions.get(currentSessionId);
        if (session) {
          session.finderPosition = { x: data.x, y: data.y, room: data.room, facing: data.facing };
        }
        broadcastToSession(currentSessionId, {
          type: 'FINDER_MOVED',
          finderPosition: { x: data.x, y: data.y, room: data.room, facing: data.facing }
        });
      }

    } catch (err) {
      console.error('WebSocket message error:', err);
    }
  });

  ws.on('close', () => {
    if (currentSessionId && socketSessions.has(currentSessionId)) {
      socketSessions.get(currentSessionId).delete(ws);
      if (socketSessions.get(currentSessionId).size === 0) {
        socketSessions.delete(currentSessionId);
      }
    }
  });
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

server.listen(port, () => {
  console.log(`✨ Find Your Bestfriend Server running on http://localhost:${port}`);
  console.log(`🎮 Demo Account: alex_and_jordan / bff`);
});
