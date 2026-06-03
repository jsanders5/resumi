'use client';

import { useEffect, useRef, useState } from 'react';

// Time checkpoints (seconds) mapped to progress % — tuned for a ~25s search
const CHECKPOINTS = [
  { time: 0,  pct: 0,  label: 'Connecting to job boards...' },
  { time: 4,  pct: 22, label: 'Fetching live listings...' },
  { time: 7,  pct: 38, label: 'Ranking by relevance...' },
  { time: 11, pct: 52, label: 'Scoring compatibility with AI...' },
  { time: 20, pct: 78, label: 'Analysing your fit...' },
  { time: 28, pct: 91, label: 'Almost there...' },
  { time: 40, pct: 96, label: 'Wrapping up...' },
];

function interpolate(elapsed: number): { pct: number; label: string } {
  for (let i = 0; i < CHECKPOINTS.length - 1; i++) {
    const a = CHECKPOINTS[i];
    const b = CHECKPOINTS[i + 1];
    if (elapsed >= a.time && elapsed < b.time) {
      const t = (elapsed - a.time) / (b.time - a.time);
      return {
        pct: a.pct + t * (b.pct - a.pct),
        label: t > 0.5 ? b.label : a.label,
      };
    }
  }
  return { pct: CHECKPOINTS[CHECKPOINTS.length - 1].pct, label: CHECKPOINTS[CHECKPOINTS.length - 1].label };
}

type Phase = 'idle' | 'loading' | 'completing';

export default function SearchProgress({ isLoading }: { isLoading: boolean }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [pct, setPct] = useState(0);
  const [label, setLabel] = useState('');
  const startRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (isLoading) {
      startRef.current = Date.now();
      setPhase('loading');
      setPct(0);
      setLabel(CHECKPOINTS[0].label);

      function tick() {
        const elapsed = (Date.now() - startRef.current) / 1000;
        const { pct: p, label: l } = interpolate(elapsed);
        setPct(p);
        setLabel(l);
        rafRef.current = requestAnimationFrame(tick);
      }
      rafRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafRef.current);
    } else if (phase === 'loading') {
      // Snap to 100%, then fade out
      cancelAnimationFrame(rafRef.current);
      setPhase('completing');
      setPct(100);
      setLabel('Found your matches!');
      const t = setTimeout(() => setPhase('idle'), 700);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  if (phase === 'idle') return null;

  return (
    <div
      className={`fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 transition-opacity duration-500 ${
        phase === 'completing' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="w-96 flex flex-col gap-3 px-4">
        {/* Label row */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">{label}</span>
          <span className="text-sm font-semibold text-slate-400 tabular-nums">{Math.round(pct)}%</span>
        </div>

        {/* Bar */}
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Stage dots */}
        <div className="flex justify-between mt-1">
          {['Job boards', 'Ranking', 'AI scoring', 'Done'].map((s, i) => {
            const thresholds = [0, 38, 52, 100];
            const active = pct >= thresholds[i];
            return (
              <span key={s} className={`text-xs transition-colors ${active ? 'text-indigo-400' : 'text-slate-700'}`}>
                {s}
              </span>
            );
          })}
        </div>

        <p className="text-xs text-slate-600 text-center mt-1">Typically takes 20–30 seconds</p>
      </div>
    </div>
  );
}
