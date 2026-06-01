import { NextRequest, NextResponse } from 'next/server';
import { getGitHubRecommendations } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 });
    }

    const { resumeText, targetRoles } = await req.json();
    if (!resumeText || !targetRoles?.length) {
      return NextResponse.json({ error: 'resumeText and targetRoles are required' }, { status: 400 });
    }

    const recommendations = await getGitHubRecommendations(resumeText, targetRoles);
    return NextResponse.json({ recommendations });
  } catch (err) {
    console.error('github-recs error:', err);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
