import { NextRequest, NextResponse } from 'next/server';
import { searchAllSources } from '@/lib/scrapers';
import { scoreJobsFast } from '@/lib/claude';
import { embedBatch, cosineSimilarity, isConfigured as voyageConfigured } from '@/lib/voyage';
import type { Job } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 });
    }

    const { query, location, resumeText, resumeEmbedding, turnstileToken } = await req.json();
    if (!query || !resumeText) {
      return NextResponse.json({ error: 'query and resumeText are required' }, { status: 400 });
    }

    // Verify Turnstile token when configured
    if (process.env.TURNSTILE_SECRET_KEY) {
      if (!turnstileToken) {
        return NextResponse.json({ error: 'CAPTCHA verification required' }, { status: 400 });
      }
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '';
      const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: turnstileToken, remoteip: ip }),
      });
      const result = await verification.json();
      if (!result.success) {
        return NextResponse.json({ error: 'CAPTCHA verification failed. Please try again.' }, { status: 400 });
      }
    }

    const cleanLocation = (location ?? '').trim();
    const titles = (query as string)
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 3);

    const activeSources: string[] = [];
    if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) activeSources.push('adzuna');
    if (process.env.JSEARCH_API_KEY) activeSources.push('jsearch');
    if (activeSources.length === 0) {
      return NextResponse.json({ error: 'No job sources are configured' }, { status: 500 });
    }

    // Resume embedding was computed at upload time and sent by the client
    const searchResults = await Promise.all(
      titles.map((title) => searchAllSources(title, cleanLocation, activeSources))
    );

    const seen = new Set<string>();
    const allJobs: Job[] = searchResults.flat().filter((job) => {
      const key = `${job.title.toLowerCase().trim()}||${job.company.toLowerCase().trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (allJobs.length === 0) {
      return NextResponse.json({ jobs: [] });
    }

    // Rank by semantic similarity if Voyage is configured, otherwise take first 10
    let jobsToScore: Job[];

    const hasEmbedding = voyageConfigured() && Array.isArray(resumeEmbedding) && resumeEmbedding.length > 0;

    if (hasEmbedding) {
      const jobTexts = allJobs.map((j) => `${j.title} ${j.company} ${j.description.slice(0, 400)}`);
      const jobEmbeddings = await embedBatch(jobTexts);
      jobsToScore = allJobs
        .map((job, i) => ({ job, similarity: cosineSimilarity(resumeEmbedding, jobEmbeddings[i] ?? []) }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10)
        .map((r) => r.job);
    } else {
      jobsToScore = allJobs.slice(0, 10);
    }

    const scoredJobs = await scoreJobsFast(resumeText, jobsToScore);
    scoredJobs.sort((a, b) => b.score - a.score);

    return NextResponse.json({ jobs: scoredJobs });
  } catch (err) {
    console.error('search-jobs error:', err);
    return NextResponse.json({ error: 'Failed to search jobs' }, { status: 500 });
  }
}
