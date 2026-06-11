'use client';

import { NotFoundRunnerGame } from '@/components/shared/not-found/NotFoundRunnerGame';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Home, LayoutDashboard, Sparkles } from 'lucide-react';
import Link from 'next/link';

const floatingDigits = [
  { digit: '4', x: '8%', y: '12%', delay: 0, size: 'text-7xl' },
  { digit: '0', x: '82%', y: '8%', delay: 0.4, size: 'text-8xl' },
  { digit: '4', x: '88%', y: '72%', delay: 0.8, size: 'text-6xl' },
];

export function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/80 to-indigo-100/60 px-4 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/40">
      {/* Animated grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(37,99,235,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.08) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Floating 404 digits */}
      {floatingDigits.map(({ digit, x, y, delay, size }) => (
        <motion.span
          key={`${digit}-${x}`}
          className={`pointer-events-none absolute font-black text-blue-500/10 dark:text-blue-400/10 ${size}`}
          style={{ left: x, top: y }}
          animate={{ y: [0, -18, 0], rotate: [0, 4, -4, 0] }}
          transition={{
            duration: 6,
            repeat: Number.POSITIVE_INFINITY,
            delay,
            ease: 'easeInOut',
          }}
        >
          {digit}
        </motion.span>
      ))}

      {/* Glow orbs */}
      <motion.div
        className="pointer-events-none absolute -left-32 top-1/4 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
      />
      <motion.div
        className="pointer-events-none absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-xl"
      >
        {/* Header */}
        <div className="mb-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-white/70 px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur-sm dark:border-blue-800/40 dark:bg-slate-900/70 dark:text-blue-300"
          >
            <Sparkles className="size-3.5" />
            Lost in the campus?
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl dark:from-blue-400 dark:via-indigo-300 dark:to-blue-400"
          >
            404
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-lg font-semibold text-foreground"
          >
            Page not found
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground"
          >
            This URL doesn&apos;t exist. While you&apos;re here, dodge the
            obstacles and beat your high score!
          </motion.p>
        </div>

        {/* Game card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-xl shadow-blue-500/10 backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-blue-900/20"
        >
          <NotFoundRunnerGame />
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <Link href="/" className="flex-1">
            <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500">
              <Home className="size-4" />
              Go home
            </Button>
          </Link>
          <Link href="/admin" className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <LayoutDashboard className="size-4" />
              Go to dashboard
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
