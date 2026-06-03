'use client';

import { TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import type { ScoredJob } from '@/lib/types';

function Bar({ label, value }: { label: string; value: number }) {
  let color: string;
  if (value >= 80) color = 'bg-emerald-500';
  else if (value >= 60) color = 'bg-blue-500';
  else if (value >= 40) color = 'bg-amber-500';
  else color = 'bg-rose-500';

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-300 w-7 text-right">{value}</span>
    </div>
  );
}

export default function ScoreAnalysis({ job }: { job: ScoredJob }) {
  const { breakdown, matchedSkills, strengths, gaps } = job;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Score Breakdown</p>
        <div className="flex flex-col gap-2.5">
          <Bar label="Skills" value={breakdown.skills} />
          <Bar label="Experience" value={breakdown.experience} />
          <Bar label="Domain" value={breakdown.domain} />
          <Bar label="Requirements" value={breakdown.requirements} />
        </div>
      </div>

      {matchedSkills.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <CheckCircle size={11} className="text-emerald-500" /> Matched Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {matchedSkills.map((s) => (
              <span key={s} className="bg-emerald-500/15 text-emerald-400 text-xs px-2 py-0.5 rounded-md">{s}</span>
            ))}
          </div>
        </div>
      )}

      {strengths.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <TrendingUp size={11} className="text-emerald-500" /> Strengths
          </p>
          <ul className="flex flex-col gap-1.5">
            {strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="text-emerald-500 mt-0.5">•</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {gaps.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <TrendingDown size={11} className="text-amber-500" /> Gaps
          </p>
          <ul className="flex flex-col gap-1.5">
            {gaps.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="text-amber-500 mt-0.5">•</span>{g}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
