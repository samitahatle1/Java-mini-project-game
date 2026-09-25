# 👯 Find Your Bestfriend

> **A two-player cooperative mystery-exploration game designed to strengthen trust, empathy, and communication between best friends.**

---

## 🌟 Game Overview

In **Find Your Bestfriend**, two best friends play concurrently:
1. **The Answerer (User 2)** secretly answers **10 personal preference/quirk questions** (comfort foods, dream travels, pet peeves, coping habits, friendship lore). These become the private truth set for the round.
2. **The Finder (User 1)** loads into an explorable, themed 2D world. As they explore connected rooms and waypoints, Multiple Choice Questions (MCQs) appear, synthesized from the Answerer's choices plus 3 plausible distractors.
3. Every correct answer closes the distance on the **Progress-to-Friend meter** (from 1,000m down to 0m) and unlocks forward passage. Reaching **6/10 correct answers** reunites the friends and wins the round!
4. Winning unlocks celebratory friendship rewards: dynamic friendship titles ("Telepathic Duo", "Soul Twins"), a customizable friendship meme memory card, and free third-party partner reward coupon vouchers (e.g. 50% Off Boba for Two, Free Co-Op Gaming Pass).
5. **Horror Round Progression**: Completing 5 rounds (with at least 2 Easy, 2 Medium, and 1 Hard) unlocks **The Whispering Realm (Midnight Echoes)** — a dark atmospheric gothic remix with candlelight glow, mist, and will-o'-the-wisps!

---

## 🎨 Visual & UX Direction (§4 & §9.5)

- **Pastel Palette**: Soft lavender (`#E7DFFF`), blush pink (`#FFE3EC`), mint (`#DFF7EA`), buttercream (`#FFF4D6`), sky blue (`#DCEEFF`), and warm charcoal (`#3A3A45`) for text.
- **Theme-Specific UI Chrome (§9.5.B)**:
  - 🌿 **Nature**: Leaf/vine border corners and glowing paw/leaf markers.
  - 🏫 **School**: Notebook-page ruled lines, binder tab clips, and chalk circle markers.
  - 🍭 **Cartoon World**: Scalloped bubbly border edges, bouncy radius, and starburst markers.
  - 🏰 **Big House**: Soft molded wood-frame card borders and keyhole markers.
  - 🧭 **War Field**: Muted tactical stencil brackets and compass markers.
  - 🛒 **Supermarket**: Barcode-strip header accents and price-tag markers.
  - 🕯️ **Horror Round**: Candlelight glow border, dark slate surface with pastel accents, and flickering flame markers.
- **2D World Depth Pass (§9.5.A)**:
  - **Layered Parallax Background**: Far background, room outlines, and foreground elements scrolling at staggered speeds.
  - **Tile-Based Ground**: Procedural 64px tiled terrain variants for each theme (grass/stepping stones, parquet tiles, candy bubbles, hardwood herringbone, concrete sand, checker linoleum, gothic cobblestones).
  - **Directional Animated Sprite Avatar**: 4-direction facing (Up, Down, Left, Right), animated leg/arm walk cycles, directional eye gaze, customizable pastel outfits, and walking dust particles.
  - **Obstacles & Light Collision**: Axis-aligned collision allowing the avatar to navigate around trees, bookshelves, fireplaces, candy towers, and tombstones.
  - **Ambient Motion Particles**: Drifting fireflies and falling leaves (Nature), paper planes and dust motes (School), floating bouncing stars (Cartoon), fireplace sparks (Big House), radar beacon waves (War Field), floor gleams (Supermarket), and drifting fog tendrils (Horror).
  - **Minimap Corner Radar**: HUD widget showing map bounds, rooms, player dot with heading beam, and waypoint status (completed, active, pending, friend target).
  - **Weather/Lighting Vignette**: Radial light grading tailored to each theme.
- **Sound Design**:
  - Zero-asset Web Audio API procedural synthesizer for ambient themes (flutes, music boxes, playful arpeggios, dark drones).
  - Gentle audio cues: pleasant major chord chime for correct answers, soft warm wobble for wrong answers (never punishing), and victory fanfare.

---

## 🕹️ Controls

- **Desktop**:
  - `WASD` or `Arrow Keys` to move avatar
  - **Mouse Click-to-Move** / hold to steer
- **Mobile / Tablet**:
  - Responsive **Virtual Touch D-Pad / Joystick** on screen
- **Duo View Mode**:
  - Built-in split-screen view allowing both friends (or a single player testing both roles) to interact simultaneously on one device.

---

## 🚀 Quick Start & Running the Project

### Prerequisites
- Node.js (v18+) and npm

### 1. Start the Full-Stack Application
```bash
npm start
```
The server will start on **`http://localhost:3001`**, serving:
- REST API endpoints (`/api/...`)
- Real-time WebSocket sync (`/ws`)
- Built responsive client web application

### 2. Run the End-to-End Test Suite
```bash
npm test
```
Executes all 11 automated integration tests (shared registration, dual login, 10-question deck submission, waypoint MCQ evaluation, hint token mechanics, win state triggering, reward cards, and horror round eligibility).

### 3. Development Mode (Optional)
If you wish to run the client and server with hot reloading:
```bash
# Terminal 1: Backend Server
npm run dev:server

# Terminal 2: Frontend Vite Client
npm run dev:client
```

---

## 👥 Instant Demo Pair

You can test the game immediately without manual registration using the built-in demo pair:
- **Shared Username**: `alex_and_jordan`
- **Shared Password**: `bff`
- **User 1**: Alex 🌸
- **User 2**: Jordan ⭐

---

## 📡 API Reference

- `POST /api/auth/register` — Register duo account with shared username + password
- `POST /api/auth/login` — Log in concurrently as User 1 or User 2
- `GET /api/auth/demo` — Instant 1-click test credentials
- `GET /api/themes` — List 7 explorable themes with lock status
- `POST /api/sessions` — Start new round (difficulty, theme, roles)
- `GET /api/sessions/:id` — Current round state
- `POST /api/sessions/:id/answers` — Answerer submits 10 truth answers
- `POST /api/sessions/:id/submit` — Finder submits waypoint MCQ answer
- `POST /api/sessions/:id/hint` — Deduct hint token to eliminate a distractor
- `POST /api/sessions/:id/position` — Sync Finder world coordinates
- `GET /api/users/:id/progress` — Rounds won, achievements, horror eligibility
- `POST /api/users/:id/progress/unlock-horror-dev` — Dev bypass to test Horror Round
- `GET /api/coupons` — Partner reward coupons
