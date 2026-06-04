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

export async function scoreJobsFast(
  resumeText: string,
  rawJobs: Job[],
  profile?: ResumeProfile
): Promise<ScoredJob[]> {
  const jobs = rawJobs.slice(0, 10);
  const defaultBreakdown: ScoreBreakdown = { skills: 0, experience: 0, domain: 0, requirements: 0 };

  const jobsBlock = jobs
    .map((j, i) => `JOB ${i + 1}:\nTitle: ${j.title}\nCompany: ${j.company}\nDescription:\n${j.description.slice(0, 500)}`)
    .join('\n\n---\n\n');

  const profileContext = profile
    ? `Candidate is a ${profile.seniority} seeking: ${profile.targetRoles.join(', ')}. Top skills: ${profile.topSkills.join(', ')}.`
    : '';

  const prompt = `Score each job against the candidate resume in the system prompt.
${profileContext ? `\n${profileContext}\n` : ''}
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

// ─── Resume Profile Extraction ────────────────────────────────────────────
// Extract seniority, skills, target roles, industries for session context

export interface ResumeProfile {
  seniority: 'Entry' | 'Mid-level' | 'Senior' | 'Lead' | 'Executive';
  topSkills: string[];
  targetRoles: string[];
  industries: string[];
}

export async function extractResumeProfile(resumeText: string): Promise<ResumeProfile> {
  const prompt = `Analyze this resume and extract structured data:

${resumeText.slice(0, 2000)}

Return ONLY a JSON object with:
- "seniority": string, one of: "Entry", "Mid-level", "Senior", "Lead", "Executive"
- "topSkills": string[] (5 main technical/professional skills)
- "targetRoles": string[] (2-3 job titles this person likely seeks)
- "industries": string[] (2-3 industries they've worked in or might target)`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = (message.content[0] as { text: string }).text.trim();
  return JSON.parse(extractJson(raw));
}

// ─── Card expand ──────────────────────────────────────────────────────────────
// Only fetches GitHub recommendations — breakdown/analysis already in ScoredJob.

export async function getJobDetails(resumeText: string, job: Job, profile?: ResumeProfile): Promise<JobDetails> {
  const difficultyHint = profile
    ? profile.seniority === 'Entry'
      ? 'Beginner to Intermediate difficulty, strong fundamentals'
      : profile.seniority === 'Mid-level'
        ? 'Intermediate difficulty, show depth and impact'
        : 'Advanced difficulty, demonstrate architectural thinking'
    : 'balanced difficulty across all levels';

  const prompt = `Using the candidate resume in the system prompt, suggest exactly 3 GitHub portfolio projects to build for this role.
Each project should be completable in 3-7 days of focused work (not a months-long endeavor). ${difficultyHint}.

Job Title: ${job.title}
Company: ${job.company}
Description:
${job.description.slice(0, 1200)}

Return ONLY a JSON array of exactly 3 objects, each with:
- "title": string
- "description": string (2-3 sentences, emphasize scope: full-stack app, CLI tool, REST API, data pipeline, etc.)
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
