'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Search, FileText, RotateCcw, Loader2 } from 'lucide-react';
import JobCard from '@/components/JobCard';
import LocationInput from '@/components/LocationInput';
import SearchProgress from '@/components/SearchProgress';
import { Turnstile } from '@marsidev/react-turnstile';
import type { ScoredJob } from '@/lib/types';
import type { ResumeProfile } from '@/lib/claude';

type Phase = 'upload' | 'search' | 'results';

const UPLOAD_MESSAGES = [
  'Extracting text from resume...',
  'Generating semantic embedding...',
  'Analyzing your profile...',
];

const LOADING_MESSAGES = [
  'Searching for matching jobs...',
  'Ranking by semantic similarity...',
  'Scoring top matches with AI...',
];

export default function Home() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [resumeText, setResumeText] = useState('');
  const [resumeEmbedding, setResumeEmbedding] = useState<number[]>([]);
  const [resumeProfile, setResumeProfile] = useState<ResumeProfile | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileVerified, setTurnstileVerified] = useState(false);
  const [fileName, setFileName] = useState('');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  const [jobs, setJobs] = useState<ScoredJob[]>([]);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [rankingSkipped, setRankingSkipped] = useState(false);
  const [showRankingToast, setShowRankingToast] = useState(false);
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
        // Reset file input so it can be used again
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setError('');
      setIsLoading(true);
      // Show upload-specific messages
      loadingIndexRef.current = 0;
      setLoadingMsg(UPLOAD_MESSAGES[0]);
      loadingIntervalRef.current = setInterval(() => {
        loadingIndexRef.current = (loadingIndexRef.current + 1) % UPLOAD_MESSAGES.length;
        setLoadingMsg(UPLOAD_MESSAGES[loadingIndexRef.current]);
      }, 2000);

      try {
        const formData = new FormData();
        formData.append('resume', file);
        const res = await fetch('/api/parse-resume', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to parse resume');
        setResumeText(data.text);
        setResumeEmbedding(data.embedding ?? []);
        setResumeProfile(data.profile ?? null);
        setFileName(file.name);
        // Reset file input so it can be used again
        if (fileInputRef.current) fileInputRef.current.value = '';
        setPhase('search');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse resume');
        // Reset file input so it can be used again
        if (fileInputRef.current) fileInputRef.current.value = '';
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
      setIsSearching(true);

      try {
        const res = await fetch('/api/search-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, location, resumeText, resumeEmbedding, resumeProfile, turnstileToken }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to search jobs');
        setJobs(data.jobs);
        setRankingSkipped(data.rankingSkipped ?? false);
        if (data.rankingSkipped) {
          setShowRankingToast(true);
          setTimeout(() => setShowRankingToast(false), 3000);
        }
        setPhase('results');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsSearching(false);
        setIsLoading(false);
        setLoadingMsg('');
      }
    },
    [query, location, resumeText, resumeEmbedding, turnstileToken]
  );

  const reset = useCallback(() => {
    setPhase('upload');
    setResumeText('');
    setResumeEmbedding([]);
    setResumeProfile(null);
    setFileName('');
    setQuery('');
    setLocation('');
    setJobs([]);
    setError('');
    setTurnstileToken('');
    setTurnstileVerified(false);
    setRankingSkipped(false);
    setShowRankingToast(false);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={reset} className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
            {/* Logo mark */}
            <div className="w-10 h-10 rounded flex items-center justify-center shrink-0 relative"
              style={{ background: '#1e293b', border: '2px solid #6366f1' }}>
              <span className="text-purple-400 font-black text-xl leading-none" style={{color: '#6366f1' }}>R</span>
              <span className="absolute" style={{ top: '6px', right: '3px', color: '#6366f1', fontSize: '8px', fontWeight: 'bold', lineHeight: '1' }}>AI</span>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-white tracking-tight">Resumio-AI</h1>
              <p className="text-xs text-slate-500">AI-powered job matching & portfolio advisor</p>
            </div>
          </button>
          <div className="flex items-center gap-3">
            <a
              href="https://buymeacoffee.com/jsanders"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20 hover:border-amber-500/40"
              title="Support the development of Resumio-AI"
            >
              ☕ Buy me a coffee
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
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

        {/* Resume upload spinner (fast, ~1-2s) */}
        {isLoading && !isSearching && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 gap-4">
            <Loader2 size={36} className="text-indigo-400 animate-spin" />
            <p className="text-slate-300 text-sm">{loadingMsg}</p>
          </div>
        )}

        {/* Search progress bar (20-30s) */}
        <SearchProgress isLoading={isSearching} />

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
          </div>
        )}

        {/* Hidden file input — accessible from all phases */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            console.log('File selected:', f?.name);
            if (f) handleFile(f);
          }}
        />

        {/* Phase: Search */}
        {phase === 'search' && (
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between gap-3 mb-8 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-emerald-400 shrink-0" />
                <span className="text-sm text-slate-300">
                  <span className="text-emerald-400 font-medium">{fileName}</span> loaded successfully
                </span>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-slate-400 hover:text-slate-300 transition-colors px-2 py-1 rounded hover:bg-slate-800"
              >
                Change
              </button>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">What are you looking for?</h2>
            <p className="text-slate-400 text-sm mb-8">
              Search live job listings and score them against your resume.
            </p>

            {resumeProfile && (
              <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 mb-8">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Profile</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-1 rounded">{resumeProfile.seniority}</span>
                  {resumeProfile.topSkills.slice(0, 3).map((skill) => (
                    <span key={skill} className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded">{skill}</span>
                  ))}
                </div>
              </div>
            )}

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
                <label className="block text-xs text-slate-500 mb-1.5">
                  Location <span className="text-slate-600">(optional — specific cities give 5-10x better results)</span>
                </label>
                <LocationInput value={location} onChange={setLocation} />
              </div>
              {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileVerified && (
                <div className="flex flex-col gap-1">
                  <Turnstile
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                    onSuccess={(token) => {
                      setTurnstileToken(token);
                      setTurnstileVerified(true);
                    }}
                    onExpire={() => setTurnstileToken('')}
                    onError={() => setTurnstileToken('')}
                    options={{ theme: 'dark' }}
                  />
                  {!turnstileToken && (
                    <p className="text-xs text-slate-500">Waiting for security check to complete...</p>
                  )}
                </div>
              )}
              <button
                type="submit"
                disabled={Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) && !turnstileVerified}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors mt-2"
              >
                <Search size={16} />
                {Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) && !turnstileVerified ? 'Verifying...' : 'Find Jobs'}
              </button>
            </form>
          </div>
        )}

        {/* Phase: Results */}
        {phase === 'results' && (
          <div className="max-w-5xl mx-auto flex flex-col gap-10">
            {/* Toast notification */}
            {showRankingToast && (
              <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-amber-500/20 border border-amber-500/40 rounded-lg px-4 py-3 text-sm text-amber-300 z-40 animate-in fade-in duration-300">
                Ranking temporarily unavailable — showing default order
              </div>
            )}

            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">
                    {jobs.length} Jobs Found
                    <span className="text-slate-500 font-normal text-sm ml-2">
                      for &ldquo;{query}&rdquo;{location ? ` · ${location}` : ''}
                    </span>
                  </h2>
                  {rankingSkipped && (
                    <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded-md font-medium">
                      default order
                    </span>
                  )}
                  {!rankingSkipped && jobs.length > 0 && (
                    <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-md font-medium">
                      AI-ranked
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setPhase('search'); setTurnstileToken(''); setTurnstileVerified(false); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors border border-indigo-500/20 hover:border-indigo-500/40 text-xs font-medium"
                  >
                    <Search size={12} />
                    New search
                  </button>
                  <button
                    onClick={reset}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-slate-700 transition-colors border border-slate-700 hover:border-slate-600 text-xs font-medium"
                  >
                    <RotateCcw size={12} />
                    Start over
                  </button>
                </div>
              </div>

              {!location && jobs.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 mb-4">
                  <p className="text-xs text-slate-400">
                    💡 <span className="text-slate-300">Tip: Searching by specific city (e.g., "San Francisco, CA") typically yields 5-10x more relevant results.</span>
                  </p>
                </div>
              )}

              {jobs.length === 0 ? (
                <p className="text-slate-500 text-sm">No jobs found. Try a different query.</p>
              ) : (
                <>
                  <p className="text-sm text-slate-300 mb-6 font-medium">
                    Click any card to see your score analysis and recommended project ideas to add to your portfolio.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {jobs.map((job) => (
                      <JobCard key={job.id} job={job} resumeText={resumeText} resumeProfile={resumeProfile} />
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
            <a href="/privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-slate-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
