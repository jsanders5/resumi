import { NextRequest, NextResponse } from 'next/server';
import { getJobSpecificRecommendations } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 });
    }

    const { resumeText, job } = await req.json();
    if (!resumeText || !job) {
      return NextResponse.json({ error: 'resumeText and job are required' }, { status: 400 });
    }

    const recommendations = await getJobSpecificRecommendations(resumeText, job);
    return NextResponse.json({ recommendations });
  } catch (err) {
    console.error('job-recs error:', err);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
