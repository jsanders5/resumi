'use client';

import { GitBranch } from 'lucide-react';
import type { GitHubRecommendation } from '@/lib/types';

const difficultyStyle: Record<GitHubRecommendation['difficulty'], string> = {
  Beginner: 'bg-emerald-500/20 text-emerald-400',
  Intermediate: 'bg-blue-500/20 text-blue-400',
  Advanced: 'bg-violet-500/20 text-violet-400',
};

export default function GitHubCard({ rec, compact = false }: { rec: GitHubRecommendation; compact?: boolean }) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-lg flex flex-col gap-2 hover:border-slate-700 transition-colors ${compact ? 'p-3' : 'p-5 gap-3'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <GitBranch size={compact ? 13 : 16} className="text-slate-400 shrink-0" />
          <h3 className={`text-white font-semibold ${compact ? 'text-xs' : 'text-sm'}`}>{rec.title}</h3>
        </div>
        <span className={`px-2 py-0.5 rounded-full font-medium shrink-0 ${compact ? 'text-xs' : 'text-xs'} ${difficultyStyle[rec.difficulty]}`}>
          {rec.difficulty}
        </span>
      </div>

      <p className={`text-slate-400 leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>{rec.description}</p>

      <p className={`text-indigo-400 italic ${compact ? 'text-xs' : 'text-xs'}`}>{rec.whyItMatters}</p>

      <div className="flex flex-wrap gap-1.5">
        {rec.techStack.map((tech) => (
          <span key={tech} className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-md">
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
}
