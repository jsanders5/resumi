import { NextRequest, NextResponse } from 'next/server';
import { searchAllSources } from '@/lib/scrapers';
import { scoreJobsAgainstResume } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 });
    }

    const { query, location, resumeText, sources } = await req.json();
    if (!query || !resumeText) {
      return NextResponse.json({ error: 'query and resumeText are required' }, { status: 400 });
    }

    const enabledSources: string[] = Array.isArray(sources) && sources.length > 0
      ? sources
      : ['jsearch', 'linkedin'];

    // JSearch requires its own API key; skip gracefully if missing
    const activeSources = enabledSources.filter((id) => {
      if (id === 'jsearch' && !process.env.JSEARCH_API_KEY) return false;
      return true;
    });

    if (activeSources.length === 0) {
      return NextResponse.json({ error: 'No configured job sources are enabled' }, { status: 400 });
    }

    const jobs = await searchAllSources(query, location ?? '', activeSources);
    if (jobs.length === 0) {
      return NextResponse.json({ jobs: [] });
    }

    const scoredJobs = await scoreJobsAgainstResume(resumeText, jobs);
    scoredJobs.sort((a, b) => b.score - a.score);

    return NextResponse.json({ jobs: scoredJobs });
  } catch (err) {
    console.error('search-jobs error:', err);
    return NextResponse.json({ error: 'Failed to search jobs' }, { status: 500 });
  }
}
