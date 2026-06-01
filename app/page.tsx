'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Search, FileText, RotateCcw, Loader2 } from 'lucide-react';
import JobCard from '@/components/JobCard';
import type { ScoredJob } from '@/lib/types';

type Phase = 'upload' | 'search' | 'results';

const LOADING_MESSAGES = [
  'Parsing your resume...',
  'Searching for matching jobs...',
  'Scoring compatibility with AI...',
];

const SOURCE_OPTIONS = [
  { id: 'linkedin', name: 'LinkedIn', description: 'Direct scrape' },
  { id: 'jsearch', name: 'JSearch', description: 'Indeed + LinkedIn API' },
];

export default function Home() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [sources, setSources] = useState<Record<string, boolean>>({ linkedin: true, jsearch: true });
  const [jobs, setJobs] = useState<ScoredJob[]>([]);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingIndexRef = useRef(0);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startLoadingCycle = useCallback((startIndex = 0) => {
    loadingIndexRef.current = startIndex;
    setLoadingMsg(LOADING_MESSAGES[startIndex]);
    loadingIntervalRef.current = setInterval(() => {
      loadingIndexRef.current = (loadingIndexRef.current + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[loadingIndexRef.current]);
    }, 3000);
  }, []);

  const stopLoadingCycle = useCallback(() => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
        setError('Please upload a PDF or .txt file.');
        return;
      }
      setError('');
      setIsLoading(true);
      setLoadingMsg('Parsing your resume...');

      try {
        const formData = new FormData();
        formData.append('resume', file);
        const res = await fetch('/api/parse-resume', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to parse resume');
        setResumeText(data.text);
        setFileName(file.name);
        setPhase('search');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse resume');
      } finally {
        setIsLoading(false);
        setLoadingMsg('');
      }
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim()) return;
      setError('');
      setIsLoading(true);
      startLoadingCycle(1);

      try {
        const res = await fetch('/api/search-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            location,
            resumeText,
            sources: Object.entries(sources).filter(([, on]) => on).map(([id]) => id),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to search jobs');
        setJobs(data.jobs);
        setPhase('results');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        stopLoadingCycle();
        setIsLoading(false);
        setLoadingMsg('');
      }
    },
    [query, location, resumeText, sources, startLoadingCycle, stopLoadingCycle]
  );

  const reset = useCallback(() => {
    setPhase('upload');
    setResumeText('');
    setFileName('');
    setQuery('');
    setLocation('');
    setJobs([]);
    setError('');
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">resumi</h1>
            <p className="text-xs text-slate-500">AI-powered job matching & portfolio advisor</p>
          </div>
          {phase !== 'upload' && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw size={14} />
              Start over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          {(['Upload Resume', 'Search Jobs', 'Results'] as const).map((step, i) => {
            const stepPhase: Phase[] = ['upload', 'search', 'results'];
            const isCurrent = stepPhase[i] === phase;
            const isDone =
              (i === 0 && (phase === 'search' || phase === 'results')) ||
              (i === 1 && phase === 'results');
            return (
              <div key={step} className="flex items-center gap-2">
                {i > 0 && <div className="w-8 h-px bg-slate-700" />}
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isCurrent ? 'text-white' : isDone ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-3 text-sm text-rose-400">
            {error}
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 gap-4">
            <Loader2 size={36} className="text-indigo-400 animate-spin" />
            <p className="text-slate-300 text-sm">{loadingMsg}</p>
          </div>
        )}

        {/* Phase: Upload */}
        {phase === 'upload' && (
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Upload your resume</h2>
              <p className="text-slate-400 text-sm">
                We&apos;ll parse it and match you against live job listings, then suggest GitHub
                projects to fill your skill gaps.
              </p>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-colors ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700 hover:border-slate-600 hover:bg-slate-900/50'
              }`}
            >
              <Upload size={32} className="text-slate-500" />
              <div className="text-center">
                <p className="text-white font-medium">Drop your resume here</p>
                <p className="text-slate-500 text-sm mt-1">or click to browse</p>
              </div>
              <p className="text-slate-600 text-xs">PDF or .txt · Max 10 MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
        )}

        {/* Phase: Search */}
        {phase === 'search' && (
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-2 mb-8 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3">
              <FileText size={16} className="text-emerald-400 shrink-0" />
              <span className="text-sm text-slate-300">
                <span className="text-emerald-400 font-medium">{fileName}</span> loaded successfully
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">What are you looking for?</h2>
            <p className="text-slate-400 text-sm mb-8">
              Enter a job title and optional location to search live listings and score them against
              your resume.
            </p>
            <form onSubmit={handleSearch} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Job Title</label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Software Engineer, Data Scientist"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Location (optional)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. New York, Remote"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-2">Sources</label>
                <div className="flex gap-3">
                  {SOURCE_OPTIONS.map(({ id, name, description }) => {
                    const on = sources[id] ?? false;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSources((s) => ({ ...s, [id]: !s[id] }))}
                        className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-colors ${
                          on
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-slate-700 bg-slate-900 opacity-50'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-semibold text-white">{name}</p>
                          <p className="text-xs text-slate-500">{description}</p>
                        </div>
                        <div className={`w-8 h-4 rounded-full flex items-center transition-colors ${on ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                          <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform mx-0.5 ${on ? 'translate-x-4' : ''}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                type="submit"
                disabled={!Object.values(sources).some(Boolean)}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors mt-2"
              >
                <Search size={16} />
                Find Jobs
              </button>
            </form>
          </div>
        )}

        {/* Phase: Results */}
        {phase === 'results' && (
          <div className="flex flex-col gap-10">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">
                  {jobs.length} Jobs Found
                  <span className="text-slate-500 font-normal text-sm ml-2">
                    for &ldquo;{query}&rdquo;{location ? ` · ${location}` : ''}
                  </span>
                </h2>
                <button
                  onClick={() => setPhase('search')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                >
                  <Search size={12} />
                  New search
                </button>
              </div>
              {jobs.length === 0 ? (
                <p className="text-slate-500 text-sm">No jobs found. Try a different query.</p>
              ) : (
                <>
                  <p className="text-xs text-slate-500 mb-4">
                    Click any card to see portfolio projects tailored to that role.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {jobs.map((job) => (
                      <JobCard key={job.id} job={job} resumeText={resumeText} />
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
