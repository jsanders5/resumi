'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Search, FileText, RotateCcw, Loader2 } from 'lucide-react';
import JobCard from '@/components/JobCard';
import LocationInput from '@/components/LocationInput';
import { Turnstile } from '@marsidev/react-turnstile';
import type { ScoredJob } from '@/lib/types';

type Phase = 'upload' | 'search' | 'results';

const LOADING_MESSAGES = [
  'Parsing resume & extracting skills...',
  'Searching for matching jobs...',
  'Ranking by semantic similarity...',
  'Scoring top matches with AI...',
];

export default function Home() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [resumeText, setResumeText] = useState('');
  const [resumeEmbedding, setResumeEmbedding] = useState<number[]>([]);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [fileName, setFileName] = useState('');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

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
      startLoadingCycle(0);

      try {
        const formData = new FormData();
        formData.append('resume', file);
        const res = await fetch('/api/parse-resume', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to parse resume');
        setResumeText(data.text);
        setResumeEmbedding(data.embedding ?? []);
        setFileName(file.name);
        setPhase('search');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse resume');
      } finally {
        stopLoadingCycle();
        setIsLoading(false);
        setLoadingMsg('');
      }
    },
    [startLoadingCycle, stopLoadingCycle]
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
          body: JSON.stringify({ query, location, resumeText, resumeEmbedding, turnstileToken }),
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
    [query, location, resumeText, startLoadingCycle, stopLoadingCycle]
  );

  const reset = useCallback(() => {
    setPhase('upload');
    setResumeText('');
    setResumeEmbedding([]);
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
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
              <span className="text-white font-black text-lg leading-none">R</span>
              <div className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-white/80" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Resumio-AI</h1>
              <p className="text-xs text-slate-500">AI-powered job matching & portfolio advisor</p>
            </div>
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
              Search live job listings and score them against your resume.
            </p>
            <form onSubmit={handleSearch} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">
                  Job Title(s)
                  <span className="ml-2 text-slate-600">comma-separate multiple titles</span>
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Software Engineer, Data Scientist, ML Engineer"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Location (optional)</label>
                <LocationInput value={location} onChange={setLocation} />
              </div>
              {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                  onSuccess={setTurnstileToken}
                  onExpire={() => setTurnstileToken('')}
                  onError={() => setTurnstileToken('')}
                  options={{ theme: 'dark' }}
                />
              )}
              <button
                type="submit"
                disabled={Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) && !turnstileToken}
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

      <footer className="border-t border-slate-800 mt-16 py-6 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-slate-600">
          <span>© {new Date().getFullYear()} Resumio-AI</span>
          <div className="flex gap-4 items-center">
            <a href="https://buymeacoffee.com/jsanders" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition-colors">☕ Buy me a coffee</a>
            <a href="/privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-slate-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
