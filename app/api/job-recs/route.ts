import { NextRequest, NextResponse } from 'next/server';
import { getJobDetails, type ResumeProfile } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 });
    }

    const { resumeText, job, resumeProfile } = await req.json();
    if (!resumeText || !job) {
      return NextResponse.json({ error: 'resumeText and job are required' }, { status: 400 });
    }

    const details = await getJobDetails(resumeText, job, resumeProfile);
    return NextResponse.json(details);
  } catch (err) {
    console.error('job-recs error:', err);
    return NextResponse.json({ error: 'Failed to load job details' }, { status: 500 });
  }
}
