'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const CANVAS_W = 640;
const CANVAS_H = 160;
const GROUND_H = 24;
const GRAVITY = 0.55;
const JUMP_VELOCITY = -10.5;
const PLAYER_X = 56;
const PLAYER_W = 28;
const PLAYER_H = 36;
const MIN_GAP = 90;
const MAX_GAP = 180;

type Obstacle = { x: number; w: number; h: number; kind: 'book' | 'block' };

type GameState = 'idle' | 'playing' | 'gameover';

function randomGap() {
  return MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);
}

function spawnObstacle(x: number): Obstacle {
  const kind = Math.random() > 0.5 ? 'book' : 'block';
  const h = kind === 'book' ? 22 + Math.random() * 14 : 28 + Math.random() * 18;
  const w = kind === 'book' ? 18 + Math.random() * 8 : 16 + Math.random() * 10;
  return { x, w, h, kind };
}

function drawGround(ctx: CanvasRenderingContext2D, offset: number) {
  const groundY = CANVAS_H - GROUND_H;
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, groundY, CANVAS_W, GROUND_H);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(CANVAS_W, groundY);
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  for (let i = -1; i < CANVAS_W / 28 + 2; i++) {
    const x = ((i * 28 - (offset % 28)) + CANVAS_W) % (CANVAS_W + 28) - 14;
    ctx.fillRect(x, groundY + 8, 10, 3);
  }
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  y: number,
  frame: number,
  isPlaying: boolean,
) {
  const groundY = CANVAS_H - GROUND_H;
  const py = groundY - y - PLAYER_H;
  const legOffset = isPlaying ? Math.sin(frame * 0.35) * 4 : 0;

  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.roundRect(PLAYER_X, py + 10, PLAYER_W, PLAYER_H - 10, 4);
  ctx.fill();

  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(PLAYER_X + 4, py + 14, 8, 10);
  ctx.fillRect(PLAYER_X + 16, py + 14, 8, 10);

  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(PLAYER_X + PLAYER_W / 2, py + 8, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(PLAYER_X + 8, py + 6, 3, 3);
  ctx.fillRect(PLAYER_X + 17, py + 6, 3, 3);

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(PLAYER_X + PLAYER_W / 2, py + 10, 4, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  ctx.fillStyle = '#334155';
  ctx.fillRect(PLAYER_X + 6, py + 20 + legOffset, 6, 8);
  ctx.fillRect(PLAYER_X + 16, py + 20 - legOffset, 6, 8);

  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.roundRect(PLAYER_X + PLAYER_W - 4, py + 12, 10, 14, 2);
  ctx.fill();
}

function drawObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  const groundY = CANVAS_H - GROUND_H;
  const y = groundY - obs.h;

  if (obs.kind === 'book') {
    ctx.fillStyle = '#f97316';
    ctx.fillRect(obs.x, y, obs.w, obs.h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(obs.x + 3, y + 4, obs.w - 6, 2);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(obs.x, y + obs.h - 4, obs.w, 4);
  } else {
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(obs.x, y, obs.w, obs.h);
    ctx.fillStyle = '#eef2ff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('404', obs.x + 2, y + obs.h / 2 + 3);
  }
}

function drawClouds(ctx: CanvasRenderingContext2D, offset: number) {
  ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
  const clouds = [
    { x: 80, y: 24, r: 12 },
    { x: 220, y: 18, r: 10 },
    { x: 420, y: 30, r: 14 },
    { x: 540, y: 16, r: 9 },
  ];
  for (const c of clouds) {
    const x = ((c.x - offset * 0.15) % (CANVAS_W + 80)) - 40;
    ctx.beginPath();
    ctx.arc(x, c.y, c.r, 0, Math.PI * 2);
    ctx.arc(x + c.r, c.y - 4, c.r * 0.8, 0, Math.PI * 2);
    ctx.arc(x + c.r * 1.8, c.y, c.r * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function NotFoundRunnerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const stateRef = useRef({
    playerY: 0,
    playerVy: 0,
    obstacles: [] as Obstacle[],
    frame: 0,
    speed: 5,
    scroll: 0,
    nextSpawn: 0,
    score: 0,
  });

  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const resetGame = useCallback(() => {
    stateRef.current = {
      playerY: 0,
      playerVy: 0,
      obstacles: [],
      frame: 0,
      speed: 5,
      scroll: 0,
      nextSpawn: 0,
      score: 0,
    };
    setScore(0);
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    setGameState('playing');
  }, [resetGame]);

  const jump = useCallback(() => {
    if (gameState === 'idle') {
      startGame();
      stateRef.current.playerVy = JUMP_VELOCITY;
      return;
    }
    if (gameState === 'gameover') {
      startGame();
      stateRef.current.playerVy = JUMP_VELOCITY;
      return;
    }
    if (stateRef.current.playerY <= 1) {
      stateRef.current.playerVy = JUMP_VELOCITY;
    }
  }, [gameState, startGame]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const s = stateRef.current;
      const playing = gameState === 'playing';

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      bg.addColorStop(0, '#f8fafc');
      bg.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      if (playing) s.scroll += s.speed;
      drawClouds(ctx, s.scroll);
      drawGround(ctx, s.scroll);

      if (playing) {
        s.playerVy += GRAVITY;
        s.playerY += s.playerVy;
        if (s.playerY < 0) {
          s.playerY = 0;
          s.playerVy = 0;
        }

        s.frame += 1;
        if (s.frame % 400 === 0) s.speed += 0.4;

        s.obstacles = s.obstacles
          .map((o) => ({ ...o, x: o.x - s.speed }))
          .filter((o) => o.x + o.w > 0);

        if (
          s.obstacles.length === 0 ||
          s.obstacles.at(-1)!.x < CANVAS_W - s.nextSpawn
        ) {
          s.obstacles.push(spawnObstacle(CANVAS_W + 20));
          s.nextSpawn = randomGap();
        }

        s.score += 1;
        if (s.score % 8 === 0) setScore(Math.floor(s.score / 8));

        const groundY = CANVAS_H - GROUND_H;
        const py = groundY - s.playerY - PLAYER_H;
        for (const obs of s.obstacles) {
          const pad = 4;
          if (
            PLAYER_X + PLAYER_W - pad > obs.x + pad &&
            PLAYER_X + pad < obs.x + obs.w - pad &&
            py + PLAYER_H - pad > groundY - obs.h + pad
          ) {
            setGameState('gameover');
            setHighScore((h) => Math.max(h, Math.floor(s.score / 8)));
          }
        }
      }

      for (const obs of s.obstacles) drawObstacle(ctx, obs);
      drawPlayer(ctx, s.playerY, s.frame, playing);

      if (gameState === 'idle') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
        ctx.font = '600 14px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Press Space or Tap to Run', CANVAS_W / 2, CANVAS_H / 2 - 8);
        ctx.font = '400 12px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.fillText('Jump over books & 404 blocks', CANVAS_W / 2, CANVAS_H / 2 + 12);
      }

      if (gameState === 'gameover') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = '#fff';
        ctx.font = '700 18px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', CANVAS_W / 2, CANVAS_H / 2 - 6);
        ctx.font = '400 13px system-ui, sans-serif';
        ctx.fillText('Press Space to retry', CANVAS_W / 2, CANVAS_H / 2 + 16);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [gameState]);

  return (
    <div className="relative w-full">
      <div className="mb-2 flex items-center justify-between px-1 text-xs font-medium text-muted-foreground">
        <span>
          Score: <span className="font-mono text-foreground">{score}</span>
        </span>
        <span>
          Best: <span className="font-mono text-foreground">{highScore}</span>
        </span>
      </div>

      <div
        className="relative overflow-hidden rounded-xl border border-border/60 bg-white shadow-inner dark:bg-slate-900"
        role="button"
        tabIndex={0}
        onClick={jump}
        onKeyDown={(e) => {
          if (e.key === 'Enter') jump();
        }}
        aria-label="Runner mini-game. Press space or tap to jump."
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="block h-auto w-full cursor-pointer select-none touch-none"
        />
      </div>

      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Space / ↑ / Tap to jump
      </p>
    </div>
  );
}
