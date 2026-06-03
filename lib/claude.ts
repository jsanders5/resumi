import Anthropic from '@anthropic-ai/sdk';
import type { Job, ScoredJob, JobDetails, ScoreBreakdown, GitHubRecommendation } from './types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenced ? fenced[1].trim() : text;
}

function resumeSystem(resumeText: string): Anthropic.TextBlockParam[] {
  return [
    { type: 'text', text: 'You are a JSON API. Respond only with valid JSON, no markdown fences, no explanation.' },
    { type: 'text', text: `Candidate resume:\n---\n${resumeText}\n---`, cache_control: { type: 'ephemeral' } },
  ];
}

// ─── Scoring (search results) ─────────────────────────────────────────────────
// Returns full breakdown so the score is always breakdown average — never changes on expand.

export async function scoreJobsFast(resumeText: string, rawJobs: Job[]): Promise<ScoredJob[]> {
  const jobs = rawJobs.slice(0, 10);
  const defaultBreakdown: ScoreBreakdown = { skills: 0, experience: 0, domain: 0, requirements: 0 };

  const jobsBlock = jobs
    .map((j, i) => `JOB ${i + 1}:\nTitle: ${j.title}\nCompany: ${j.company}\nDescription:\n${j.description.slice(0, 500)}`)
    .join('\n\n---\n\n');

  const prompt = `Score each job against the candidate resume in the system prompt.

${jobsBlock}

Return ONLY a JSON array with exactly ${jobs.length} objects in order:
- "breakdown": { "skills": 0-100, "experience": 0-100, "domain": 0-100, "requirements": 0-100 }
- "matchReason": string (1-2 sentences)
- "matchedSkills": string[] (up to 6 skills present in both resume and job)
- "strengths": string[] (2 specific reasons this candidate fits)
- "gaps": string[] (2 specific shortfalls)
- "missingSkills": string[] (up to 3 skills to add for this role)`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: resumeSystem(resumeText),
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = (message.content[0] as { text: string }).text.trim();
  type RawScore = {
    breakdown: ScoreBreakdown;
    matchReason: string;
    matchedSkills: string[];
    strengths: string[];
    gaps: string[];
    missingSkills: string[];
  };
  const scores: RawScore[] = JSON.parse(extractJson(raw));

  return jobs.map((job, i) => {
    const s = scores[i];
    const bd = s?.breakdown ?? defaultBreakdown;
    const score = Math.round((bd.skills + bd.experience + bd.domain + bd.requirements) / 4);
    return {
      ...job,
      score,
      matchReason: s?.matchReason ?? '',
      breakdown: bd,
      matchedSkills: s?.matchedSkills ?? [],
      strengths: s?.strengths ?? [],
      gaps: s?.gaps ?? [],
      missingSkills: s?.missingSkills ?? [],
    };
  });
}

// ─── Card expand ──────────────────────────────────────────────────────────────
// Only fetches GitHub recommendations — breakdown/analysis already in ScoredJob.

export async function getJobDetails(resumeText: string, job: Job): Promise<JobDetails> {
  const prompt = `Using the candidate resume in the system prompt, suggest exactly 3 GitHub portfolio projects to build for this role.

Job Title: ${job.title}
Company: ${job.company}
Description:
${job.description.slice(0, 1200)}

Return ONLY a JSON array of exactly 3 objects, each with:
- "title": string
- "description": string (2-3 sentences)
- "techStack": string[] (3-5 technologies from the job requirements)
- "whyItMatters": string (1 sentence: why this impresses this employer specifically)
- "difficulty": "Beginner" | "Intermediate" | "Advanced"`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: resumeSystem(resumeText),
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = (message.content[0] as { text: string }).text.trim();
  const recs: GitHubRecommendation[] = JSON.parse(extractJson(raw));
  return { recommendations: recs };
}
