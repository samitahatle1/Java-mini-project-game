import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Theme, Waypoint, Player } from '../types';
import { sound } from '../services/audio';
import { wsService } from '../services/websocket';
import { Compass, Footprints, Shield, Eye, MapPin } from 'lucide-react';

interface GameCanvasProps {
  theme: Theme;
  waypoints: Waypoint[];
  currentWaypointIndex: number;
  player: Player;
  onWaypointTrigger: (waypoint: Waypoint) => void;
  isFinder: boolean;
  hintsRemaining: number;
  score: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  theme,
  waypoints,
  currentWaypointIndex,
  player,
  onWaypointTrigger,
  isFinder,
  hintsRemaining,
  score
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Player position in world coordinates (World is 2400 x 1800)
  const playerPos = useRef({ x: 300, y: 350, facing: 'right' as 'left' | 'right' | 'up' | 'down' });
  const playerVel = useRef({ x: 0, y: 0 });
  const walkCycle = useRef(0);
  const isMoving = useRef(false);

  // Camera lerp target & current
  const camera = useRef({ x: 300, y: 350 });

  // Input states
  const keys = useRef<{ [k: string]: boolean }>({});
  const mouseTarget = useRef<{ x: number; y: number } | null>(null);

  // Ambient particles
  const particles = useRef<Particle[]>([]);

  // Waypoint proximity cooldown to prevent multiple triggers
  const lastTriggeredWp = useRef<number | null>(null);

  // Floating emotes sent from partner via WebSocket
  const [floatingEmotes, setFloatingEmotes] = useState<{ id: string; emote: string; x: number }[]>([]);

  // Mobile virtual joystick state
  const [touchActive, setTouchActive] = useState(false);
  const joystickCenter = useRef({ x: 0, y: 0 });
  const joystickCurrent = useRef({ x: 0, y: 0 });

  // Spawn ambient particles based on theme
  useEffect(() => {
    const list: Particle[] = [];
    const count = 45;
    for (let i = 0; i < count; i++) {
      let color = 'rgba(255, 255, 255, 0.6)';
      if (theme.id === 'nature') color = Math.random() > 0.5 ? 'rgba(254, 240, 138, 0.7)' : 'rgba(187, 247, 208, 0.6)'; // fireflies & leaves
      if (theme.id === 'school') color = 'rgba(224, 242, 254, 0.6)'; // dust motes
      if (theme.id === 'cartoon') color = Math.random() > 0.5 ? 'rgba(251, 207, 232, 0.7)' : 'rgba(254, 240, 138, 0.7)'; // bubbles & stars
      if (theme.id === 'bighouse') color = 'rgba(254, 215, 170, 0.65)'; // sparks
      if (theme.id === 'warfield') color = 'rgba(226, 232, 240, 0.5)';
      if (theme.id === 'supermarket') color = 'rgba(254, 205, 211, 0.6)';
      if (theme.id === 'horror') color = 'rgba(196, 181, 253, 0.45)'; // spectral wisps

      list.push({
        x: Math.random() * theme.world.width,
        y: Math.random() * theme.world.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8 - (theme.id === 'bighouse' ? 0.4 : 0),
        size: 2 + Math.random() * 4,
        alpha: 0.3 + Math.random() * 0.7,
        color
      });
    }
    particles.current = list;
  }, [theme]);

  // Subscribe to WS partner emotes
  useEffect(() => {
    const unsub = wsService.subscribe((data) => {
      if (data.type === 'EMOTE_RECEIVED') {
        const id = `${Date.now()}_${Math.random()}`;
        setFloatingEmotes(prev => [...prev, { id, emote: data.emote, x: 20 + Math.random() * 60 }]);
        setTimeout(() => {
          setFloatingEmotes(prev => prev.filter(e => e.id !== id));
        }, 3000);
      }
    });
    return unsub;
  }, []);

  // Keyboard handlers
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Main Render Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();
    let stepSoundTimer = 0;
    let wsPosThrottle = 0;

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Handle Resize dynamically
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const screenW = canvas.width;
      const screenH = canvas.height;

      // 1. Process Player Movement (Speed: 240px/s)
      const speed = 250;
      let dx = 0;
      let dy = 0;

      // Keyboard
      if (keys.current['w'] || keys.current['arrowup']) dy -= 1;
      if (keys.current['s'] || keys.current['arrowdown']) dy += 1;
      if (keys.current['a'] || keys.current['arrowleft']) dx -= 1;
      if (keys.current['d'] || keys.current['arrowright']) dx += 1;

      // Touch Virtual Joystick
      if (touchActive) {
        const jdx = joystickCurrent.current.x - joystickCenter.current.x;
        const jdy = joystickCurrent.current.y - joystickCenter.current.y;
        const dist = Math.hypot(jdx, jdy);
        if (dist > 10) {
          dx = jdx / dist;
          dy = jdy / dist;
        }
      }

      // Mouse click-to-move
      if (mouseTarget.current) {
        const worldTargetX = mouseTarget.current.x + camera.current.x - screenW / 2;
        const worldTargetY = mouseTarget.current.y + camera.current.y - screenH / 2;
        const mdx = worldTargetX - playerPos.current.x;
        const mdy = worldTargetY - playerPos.current.y;
        const mdist = Math.hypot(mdx, mdy);
        if (mdist > 12) {
          dx = mdx / mdist;
          dy = mdy / mdist;
        } else {
          mouseTarget.current = null;
        }
      }

      // Normalize diagonal speed
      const len = Math.hypot(dx, dy);
      if (len > 0) {
        dx = (dx / len) * speed * dt;
        dy = (dy / len) * speed * dt;
        isMoving.current = true;
        walkCycle.current += dt * 10;

        // Facing direction
        if (Math.abs(dx) > Math.abs(dy)) {
          playerPos.current.facing = dx > 0 ? 'right' : 'left';
        } else {
          playerPos.current.facing = dy > 0 ? 'down' : 'up';
        }

        // Footstep sound
        stepSoundTimer += dt;
        if (stepSoundTimer > 0.28) {
          sound.playStep();
          stepSoundTimer = 0;
        }
      } else {
        isMoving.current = false;
        stepSoundTimer = 0;
      }

      // 2. Obstacle Collision & Boundaries Check (§9.5)
      let nextX = Math.max(60, Math.min(theme.world.width - 60, playerPos.current.x + dx));
      let nextY = Math.max(60, Math.min(theme.world.height - 60, playerPos.current.y + dy));

      const playerRadius = 22;
      for (const obs of theme.world.obstacles) {
        const odist = Math.hypot(nextX - obs.x, nextY - obs.y);
        const minDist = playerRadius + obs.r;
        if (odist < minDist) {
          // Slide along obstacle edge
          const overlap = minDist - odist;
          const nx = (nextX - obs.x) / odist;
          const ny = (nextY - obs.y) / odist;
          nextX += nx * overlap;
          nextY += ny * overlap;
        }
      }

      playerPos.current.x = nextX;
      playerPos.current.y = nextY;

      // Broadcast position over WS throttled (every 80ms)
      wsPosThrottle += dt;
      if (wsPosThrottle > 0.08) {
        wsPosThrottle = 0;
        const currentRoom = theme.world.rooms.find(r => 
          playerPos.current.x >= r.x && playerPos.current.x <= r.x + r.w &&
          playerPos.current.y >= r.y && playerPos.current.y <= r.y + r.h
        )?.name || 'Path';

        wsService.sendPosition(
          Math.round(playerPos.current.x),
          Math.round(playerPos.current.y),
          currentRoom,
          playerPos.current.facing
        );
      }

      // 3. Smooth Camera Follow (Lerp factor: 0.08)
      camera.current.x += (playerPos.current.x - camera.current.x) * 0.08;
      camera.current.y += (playerPos.current.y - camera.current.y) * 0.08;

      // Camera clamp so we don't look past the map bounds too far
      const halfW = screenW / 2;
      const halfH = screenH / 2;
      const camX = Math.max(halfW, Math.min(theme.world.width - halfW, camera.current.x));
      const camY = Math.max(halfH, Math.min(theme.world.height - halfH, camera.current.y));

      // 4. Check Waypoint Proximity Trigger
      const activeWp = waypoints[currentWaypointIndex];
      if (activeWp) {
        const wpDist = Math.hypot(playerPos.current.x - activeWp.x, playerPos.current.y - activeWp.y);
        if (wpDist > activeWp.radius + playerRadius + 35) {
          lastTriggeredWp.current = null;
        } else if (!activeWp.isAnswered && lastTriggeredWp.current !== activeWp.index && wpDist < activeWp.radius + playerRadius) {
          lastTriggeredWp.current = activeWp.index;
          onWaypointTrigger(activeWp);
        }
      }

      // ----------------- RENDERING -----------------
      ctx.clearRect(0, 0, screenW, screenH);
      ctx.save();
      // Translate view to camera center
      ctx.translate(halfW - camX, halfH - camY);

      // A. Layer 1: Parallax Distant Horizon / Background Grid (§9.5.A)
      const tileSize = 64;
      const startTileX = Math.floor(0 / tileSize) * tileSize;
      const endTileX = theme.world.width;
      const startTileY = Math.floor(0 / tileSize) * tileSize;
      const endTileY = theme.world.height;

      // Base World Ground
      ctx.fillStyle = theme.world.tileColorA;
      ctx.fillRect(0, 0, theme.world.width, theme.world.height);

      // Tiled Texture Pass
      ctx.fillStyle = theme.world.tileColorB;
      for (let tx = startTileX; tx < endTileX; tx += tileSize) {
        for (let ty = startTileY; ty < endTileY; ty += tileSize) {
          if ((Math.floor(tx / tileSize) + Math.floor(ty / tileSize)) % 2 === 0) {
            ctx.fillRect(tx, ty, tileSize, tileSize);
          }
        }
      }

      // B. Rooms & Connected Pathways
      // Draw pathways connecting rooms
      ctx.fillStyle = theme.world.pathColor;
      for (let i = 0; i < theme.world.rooms.length - 1; i++) {
        const r1 = theme.world.rooms[i];
        const r2 = theme.world.rooms[i + 1];
        const c1x = r1.x + r1.w / 2;
        const c1y = r1.y + r1.h / 2;
        const c2x = r2.x + r2.w / 2;
        const c2y = r2.y + r2.h / 2;

        ctx.beginPath();
        ctx.lineWidth = 80;
        ctx.lineCap = 'round';
        ctx.strokeStyle = theme.world.pathColor;
        ctx.moveTo(c1x, c1y);
        ctx.lineTo(c2x, c2y);
        ctx.stroke();
      }

      // Draw Room Zones
      theme.world.rooms.forEach((room, idx) => {
        // Room floor pad
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.roundRect(room.x, room.y, room.w, room.h, 32);
        ctx.fill();

        // Subtle room border
        ctx.strokeStyle = theme.hud.accentColor;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Room Name Signpost
        ctx.fillStyle = theme.hud.textColor;
        ctx.font = '600 16px Fredoka, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`📍 ${room.name}`, room.x + 24, room.y + 36);
      });

      // C. Scenery Obstacles
      theme.world.obstacles.forEach((obs) => {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.beginPath();
        ctx.ellipse(obs.x, obs.y + obs.r * 0.8, obs.r * 0.9, obs.r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Obstacle body
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.r, 0, Math.PI * 2);
        ctx.fillStyle = theme.isHorror ? '#3B364C' : '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = theme.hud.accentColor;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Obstacle Emoji / Icon
        ctx.font = `${Math.round(obs.r * 1.1)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let emoji = '🌳';
        if (theme.id === 'nature') emoji = obs.type === 'pond' ? '🌊' : obs.type === 'boulder' ? '🪨' : '🌲';
        if (theme.id === 'school') emoji = obs.type === 'bookshelf' ? '📚' : obs.type === 'lockers' ? '🗄️' : '🛋️';
        if (theme.id === 'cartoon') emoji = obs.type === 'lollipop' ? '🍭' : obs.type === 'rainbow' ? '🌈' : '🧁';
        if (theme.id === 'bighouse') emoji = obs.type === 'fireplace' ? '🔥' : obs.type === 'piano' ? '🎹' : '🗝️';
        if (theme.id === 'warfield') emoji = obs.type === 'radar' ? '📡' : obs.type === 'antenna' ? '📻' : '📦';
        if (theme.id === 'supermarket') emoji = obs.type === 'cart' ? '🛒' : obs.type === 'freezer' ? '🍦' : '🧁';
        if (theme.id === 'horror') emoji = obs.type === 'cauldron' ? '🍲' : obs.type === 'gargoyle' ? '🦇' : '🪦';

        ctx.fillText(emoji, obs.x, obs.y);
      });

      // D. Waypoint Markers
      waypoints.forEach((wp) => {
        const isCurrent = wp.index === currentWaypointIndex;
        const isPast = wp.isAnswered;

        // Pulsing glow for active waypoint
        if (isCurrent) {
          const pulse = (Math.sin(time * 0.005) + 1) * 0.5; // 0 to 1
          ctx.beginPath();
          ctx.arc(wp.x, wp.y, wp.radius + 12 + pulse * 14, 0, Math.PI * 2);
          ctx.fillStyle = theme.isHorror ? 'rgba(168, 85, 247, 0.25)' : 'rgba(236, 72, 153, 0.2)';
          ctx.fill();
        }

        // Ground marker
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, wp.radius, 0, Math.PI * 2);
        ctx.fillStyle = isPast 
          ? (wp.isCorrect ? '#10B981' : '#F59E0B') 
          : isCurrent 
          ? (theme.isHorror ? '#8B5CF6' : '#EC4899') 
          : 'rgba(255, 255, 255, 0.8)';
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Waypoint Icon / Number
        ctx.font = 'bold 15px Fredoka, sans-serif';
        ctx.fillStyle = isPast || isCurrent ? '#FFFFFF' : '#6B7280';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (isPast) {
          ctx.fillText(wp.isCorrect ? '✓' : '•', wp.x, wp.y);
        } else {
          ctx.fillText(`${wp.index + 1}`, wp.x, wp.y);
        }

        // Room label hover pill
        if (isCurrent) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.beginPath();
          ctx.roundRect(wp.x - 55, wp.y - wp.radius - 28, 110, 22, 11);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 11px Inter, sans-serif';
          ctx.fillText('Solve MCQ 🎯', wp.x, wp.y - wp.radius - 17);
        }
      });

      // E. Goal (The Best Friend's Hiding Spot at Waypoint #10)
      const finalWp = waypoints[waypoints.length - 1];
      if (finalWp) {
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💖', finalWp.x + 35, finalWp.y - 35);
      }

      // F. The Avatar (Directional Sprite with Walk Swing & Shadow) (§9.5.A)
      const px = playerPos.current.x;
      const py = playerPos.current.y;
      const facing = playerPos.current.facing;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.beginPath();
      ctx.ellipse(px, py + 18, 18, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bobbing walking motion
      const bob = isMoving.current ? Math.sin(walkCycle.current * 1.5) * 3 : 0;
      const swing = isMoving.current ? Math.sin(walkCycle.current) * 6 : 0;

      // Avatar Body
      ctx.save();
      ctx.translate(px, py + bob);

      // Body / Outfit
      ctx.fillStyle = player.avatar?.color || '#FFE3EC';
      ctx.beginPath();
      ctx.roundRect(-14, -10, 28, 26, 10);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Walking feet / legs
      ctx.fillStyle = '#3A3A45';
      if (facing === 'left' || facing === 'right') {
        ctx.fillRect(-8 + swing, 14, 6, 7);
        ctx.fillRect(2 - swing, 14, 6, 7);
      } else {
        ctx.fillRect(-10, 14 + (isMoving.current ? Math.abs(swing) : 0), 6, 6);
        ctx.fillRect(4, 14 + (isMoving.current ? Math.abs(-swing) : 0), 6, 6);
      }

      // Head
      ctx.fillStyle = '#FFE0BD'; // skin tone
      ctx.beginPath();
      ctx.arc(0, -22, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Hair
      ctx.fillStyle = '#5B4033';
      ctx.beginPath();
      ctx.arc(0, -26, 14, Math.PI, Math.PI * 2);
      ctx.fill();

      // Eyes (directional gaze)
      ctx.fillStyle = '#222222';
      if (facing === 'right') {
        ctx.fillRect(4, -23, 3, 4);
        ctx.fillRect(9, -23, 3, 4);
      } else if (facing === 'left') {
        ctx.fillRect(-12, -23, 3, 4);
        ctx.fillRect(-7, -23, 3, 4);
      } else if (facing === 'down') {
        ctx.fillRect(-5, -22, 3, 4);
        ctx.fillRect(2, -22, 3, 4);
      } else {
        // Back of head, hair covers
        ctx.fillStyle = '#5B4033';
        ctx.beginPath();
        ctx.arc(0, -24, 13, 0, Math.PI * 2);
        ctx.fill();
      }

      // Name Tag Above Avatar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.roundRect(-35, -50, 70, 18, 9);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#2D3748';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(player.name, 0, -38);

      ctx.restore();

      // G. Ambient Animated Particles (§9.5.A)
      particles.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around world edges
        if (p.x < 0) p.x = theme.world.width;
        if (p.x > theme.world.width) p.x = 0;
        if (p.y < 0) p.y = theme.world.height;
        if (p.y > theme.world.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      ctx.restore(); // Restore camera translation

      // ----------------- SCREEN SPACE OVERLAYS -----------------

      // Weather / Lighting Vignette Tint (§9.5.A)
      const grad = ctx.createRadialGradient(screenW / 2, screenH / 2, screenH * 0.35, screenW / 2, screenH / 2, screenW * 0.7);
      if (theme.isHorror) {
        grad.addColorStop(0, 'rgba(15, 12, 28, 0.15)');
        grad.addColorStop(1, 'rgba(6, 4, 14, 0.75)');
      } else if (theme.id === 'nature') {
        grad.addColorStop(0, 'rgba(255, 255, 240, 0.05)');
        grad.addColorStop(1, 'rgba(74, 222, 128, 0.15)');
      } else {
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.0)');
        grad.addColorStop(1, 'rgba(58, 58, 69, 0.12)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, screenW, screenH);

      // Loop
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [theme, waypoints, currentWaypointIndex, player, onWaypointTrigger]);

  // Mouse / Touch handlers on canvas
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseTarget.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.buttons === 1) {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseTarget.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = touch.clientX - rect.left;
    const cy = touch.clientY - rect.top;
    joystickCenter.current = { x: cx, y: cy };
    joystickCurrent.current = { x: cx, y: cy };
    setTouchActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchActive) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    joystickCurrent.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  };

  const handleTouchEnd = () => {
    setTouchActive(false);
  };

  // Progress to friend: 10 waypoints
  const completedWaypoints = waypoints.filter(w => w.isAnswered).length;
  const distanceRemaining = Math.max(0, 1000 - completedWaypoints * 100);

  return (
    <div className="relative w-full h-[620px] md:h-[680px] bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-purple-200 select-none">
      
      {/* 2D Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        className="w-full h-full cursor-crosshair block"
      />

      {/* Floating Partner Emotes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingEmotes.map(item => (
          <div
            key={item.id}
            className="absolute bottom-20 text-5xl animate-float transition-all duration-1000"
            style={{ left: `${item.x}%` }}
          >
            {item.emote}
          </div>
        ))}
      </div>

      {/* Top HUD: Distance-to-Friend Progress Meter (§4.1 & §9.5) */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3 pointer-events-none">
        
        {/* Distance closed card */}
        <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 shadow-md flex items-center gap-3 pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-sm">
            👯
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Distance to Bestfriend
            </div>
            <div className="text-sm font-bold font-heading text-purple-900 flex items-center gap-1.5">
              <span>{distanceRemaining} meters away</span>
              <span className="text-xs text-slate-400 font-sans">({completedWaypoints}/10 waypoints)</span>
            </div>
          </div>
        </div>

        {/* Score & Hint Tokens */}
        <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 shadow-md flex items-center gap-4 pointer-events-auto">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Bond Score
            </div>
            <div className="text-sm font-bold text-emerald-700">
              {score} / 10
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Hints Left
            </div>
            <div className="text-sm font-bold text-amber-600">
              {hintsRemaining} 💡
            </div>
          </div>
        </div>

      </div>

      {/* Corner Minimap Widget (§9.5.A) */}
      <div className="absolute bottom-4 right-4 w-40 h-32 bg-slate-900/90 backdrop-blur-md rounded-2xl border-2 border-white/40 shadow-lg p-1.5 pointer-events-none hidden sm:block">
        <div className="text-[10px] font-bold text-slate-300 flex items-center justify-between px-1 mb-1">
          <span className="flex items-center gap-1"><MapPin size={11} /> Radar</span>
          <span className="text-pink-400">{completedWaypoints}/10</span>
        </div>

        <div className="relative w-full h-[90px] bg-slate-950/70 rounded-xl overflow-hidden border border-slate-800">
          {/* Room Rects */}
          {theme.world.rooms.map(r => (
            <div
              key={r.id}
              className="absolute border border-purple-500/30 bg-purple-900/20 rounded-xs"
              style={{
                left: `${(r.x / theme.world.width) * 100}%`,
                top: `${(r.y / theme.world.height) * 100}%`,
                width: `${(r.w / theme.world.width) * 100}%`,
                height: `${(r.h / theme.world.height) * 100}%`
              }}
            />
          ))}

          {/* Waypoint Dots */}
          {waypoints.map(wp => (
            <div
              key={wp.index}
              className={`absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 ${
                wp.isAnswered 
                  ? 'bg-emerald-400' 
                  : wp.index === currentWaypointIndex 
                  ? 'bg-pink-500 animate-ping' 
                  : 'bg-slate-500'
              }`}
              style={{
                left: `${(wp.x / theme.world.width) * 100}%`,
                top: `${(wp.y / theme.world.height) * 100}%`
              }}
            />
          ))}

          {/* Player Dot */}
          <div
            className="absolute w-2.5 h-2.5 rounded-full bg-cyan-300 border border-white shadow-xs -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${(playerPos.current.x / theme.world.width) * 100}%`,
              top: `${(playerPos.current.y / theme.world.height) * 100}%`
            }}
          />
        </div>
      </div>

      {/* Virtual Touch Joystick for Mobile / Tablet */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="absolute bottom-4 left-4 w-28 h-28 rounded-full bg-white/20 backdrop-blur-xs border-2 border-white/40 touch-none flex items-center justify-center md:hidden"
      >
        <div className="w-12 h-12 rounded-full bg-white/80 shadow-md text-xs font-bold text-slate-700 flex items-center justify-center">
          D-Pad
        </div>
      </div>

      {/* Desktop Controls Hint Banner */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] text-white/90 hidden md:flex items-center gap-2 pointer-events-none">
        <Footprints size={14} className="text-purple-300" />
        <span>Use <strong>WASD / Arrow Keys</strong> or <strong>Click-to-Move</strong> to explore</span>
      </div>

    </div>
  );
};
