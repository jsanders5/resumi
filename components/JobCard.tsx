'use client';

import { useState } from 'react';
import { ExternalLink, MapPin, Briefcase, AlertCircle, ChevronDown, Loader2, BarChart2, GitBranch } from 'lucide-react';
import GitHubCard from './GitHubCard';
import ScoreAnalysis from './ScoreAnalysis';
import type { ScoredJob, JobDetails } from '@/lib/types';
import type { ResumeProfile } from '@/lib/claude';

type Tab = 'analysis' | 'portfolio';

function ScoreBadge({ score }: { score: number }) {
  let label: string;
  let classes: string;
  if (score >= 85) {
    label = 'Excellent';
    classes = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  } else if (score >= 70) {
    label = 'Good';
    classes = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  } else if (score >= 55) {
    label = 'Fair';
    classes = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  } else {
    label = 'Low';
    classes = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  }
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold shrink-0 ${classes}`}>
      <span className="text-lg font-bold">{score}</span>
      <span>{label} Match</span>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function JobCard({ job, resumeText, resumeProfile }: { job: ScoredJob; resumeText: string; resumeProfile?: ResumeProfile | null }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('analysis');
  const [details, setDetails] = useState<JobDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  async function handleExpand() {
    const next = !isExpanded;
    setIsExpanded(next);
    // Fetch recs on first expand (analysis data already in job from initial search)
    if (next && details === null && !isLoadingDetails) {
      setIsLoadingDetails(true);
      setDetailsError('');
      try {
        const res = await fetch('/api/job-recs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeText, job, resumeProfile }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to load details');
        setDetails(data);
      } catch (err) {
        setDetailsError(err instanceof Error ? err.message : 'Failed to load details');
      } finally {
        setIsLoadingDetails(false);
      }
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
      {/* Main card — clickable to expand */}
      <button
        onClick={handleExpand}
        className="w-full text-left p-5 flex flex-col gap-4 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-base leading-tight truncate">{job.title}</h3>
            <p className="text-slate-400 text-sm">{job.company}</p>
          </div>
          <ScoreBadge score={job.score} />
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {job.location}
          </span>
          {job.employmentType && (
            <span className="flex items-center gap-1">
              <Briefcase size={12} />
              {job.employmentType.replace(/_/g, ' ')}
            </span>
          )}
          {job.salary && <span className="text-slate-400 font-medium">{job.salary}</span>}
          <span>{formatDate(job.datePosted)}</span>
        </div>

        <p className="text-slate-400 text-sm leading-relaxed">{job.matchReason}</p>

        {job.missingSkills.length > 0 && (
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs text-slate-500">Skill gaps: </span>
              <span className="text-xs text-amber-400">{job.missingSkills.join(', ')}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View & Apply <ExternalLink size={11} />
          </a>
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium text-xs transition-all ${
            isExpanded
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/15'
          }`}>
            {isExpanded ? 'Hide' : 'View'} Analysis
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </span>
        </div>
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="border-t border-slate-800 bg-slate-950/50">
          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                activeTab === 'analysis'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <BarChart2 size={12} />
              Score Analysis
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                activeTab === 'portfolio'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <GitBranch size={12} />
              Project Ideas
              {details && (
                <span className="ml-1 bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full text-xs">
                  {details.recommendations.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab content */}
          <div className="p-4">
            {activeTab === 'analysis' && <ScoreAnalysis job={job} />}

            {activeTab === 'portfolio' && (
              <div className="flex flex-col gap-3">
                {!isLoadingDetails && !detailsError && details && (
                  <p className="text-xs text-slate-500 mb-2">
                    AI-recommended projects to build and showcase for this role:
                  </p>
                )}
                {isLoadingDetails && (
                  <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
                    <Loader2 size={14} className="animate-spin" />
                    Generating portfolio recommendations...
                  </div>
                )}
                {detailsError && <p className="text-xs text-rose-400">{detailsError}</p>}
                {details?.recommendations.map((rec, i) => (
                  <GitHubCard key={i} rec={rec} compact />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
