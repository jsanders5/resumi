import Anthropic from '@anthropic-ai/sdk';
import type { Job, ScoredJob, ScoreBreakdown, GitHubRecommendation } from './types';

// Strip markdown fences if the model wraps output despite instructions
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenced ? fenced[1].trim() : text;
}

export async function getJobSpecificRecommendations(
  resumeText: string,
  job: Job
): Promise<GitHubRecommendation[]> {
  const prompt = `You are a career advisor. Given a resume and one specific job posting, suggest exactly 3 GitHub portfolio projects the candidate should build to impress the hiring team for THIS role specifically.

Resume:
---
${resumeText.slice(0, 2500)}
---

Job Title: ${job.title}
Company: ${job.company}
Description:
${job.description.slice(0, 1200)}

Return ONLY a JSON array (no markdown) of exactly 3 project objects, each with:
- "title": string (concise project name)
- "description": string (2-3 sentences describing what to build)
- "techStack": string[] (3-5 specific technologies from the job requirements)
- "whyItMatters": string (1 sentence: why this project directly addresses what this employer wants)
- "difficulty": "Beginner" | "Intermediate" | "Advanced"`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: 'You are a JSON API. Respond only with a valid JSON array, no markdown fences, no explanation.',
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = (message.content[0] as { text: string }).text.trim();
  return JSON.parse(extractJson(raw));
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function scoreJobsAgainstResume(
  resumeText: string,
  jobs: Job[]
): Promise<ScoredJob[]> {
  const jobsBlock = jobs
    .map(
      (j, i) =>
        `JOB ${i + 1}:\nTitle: ${j.title}\nCompany: ${j.company}\nDescription:\n${j.description.slice(0, 800)}`
    )
    .join('\n\n---\n\n');

  const prompt = `You are a career advisor scoring job compatibility. Given a resume and job postings, return a detailed JSON analysis array.

Resume:
---
${resumeText.slice(0, 3000)}
---

${jobsBlock}

Return ONLY a JSON array (no markdown) with exactly ${jobs.length} objects in order. Each object must have:
- "score": integer 0-100 (weighted average of breakdown scores)
- "matchReason": string (1-2 sentences summarising the overall fit)
- "breakdown": object with four integer scores 0-100:
    - "skills": how well the candidate's listed skills match required skills
    - "experience": alignment of seniority / years of experience
    - "domain": industry or domain knowledge match
    - "requirements": percentage of explicit job requirements met
- "matchedSkills": string[] (skills from the resume that directly appear in the job description, up to 8)
- "strengths": string[] (2-3 specific reasons this candidate is a strong fit)
- "gaps": string[] (2-3 specific reasons or missing areas holding the score down)
- "missingSkills": string[] (up to 3 concrete skills the candidate should add for this role)`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: 'You are a JSON API. Respond only with a valid JSON array, no markdown fences, no explanation.',
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = (message.content[0] as { text: string }).text.trim();

  type RawScore = {
    score: number;
    matchReason: string;
    breakdown: ScoreBreakdown;
    matchedSkills: string[];
    strengths: string[];
    gaps: string[];
    missingSkills: string[];
  };
  const scores: RawScore[] = JSON.parse(extractJson(raw));

  const defaultBreakdown: ScoreBreakdown = { skills: 0, experience: 0, domain: 0, requirements: 0 };

  return jobs.map((job, i) => ({
    ...job,
    score: scores[i]?.score ?? 0,
    matchReason: scores[i]?.matchReason ?? '',
    breakdown: scores[i]?.breakdown ?? defaultBreakdown,
    matchedSkills: scores[i]?.matchedSkills ?? [],
    strengths: scores[i]?.strengths ?? [],
    gaps: scores[i]?.gaps ?? [],
    missingSkills: scores[i]?.missingSkills ?? [],
  }));
}

export async function getGitHubRecommendations(
  resumeText: string,
  targetRoles: string[]
): Promise<GitHubRecommendation[]> {
  const prompt = `You are a career advisor recommending GitHub portfolio projects. Given a resume and the types of roles the candidate is targeting, suggest 5 projects they should build to strengthen their portfolio and land these jobs.

Resume:
---
${resumeText.slice(0, 3000)}
---

Target roles: ${targetRoles.slice(0, 5).join(', ')}

Return ONLY a JSON array (no markdown) of exactly 5 project objects, each with:
- "title": string (concise project name)
- "description": string (2-3 sentences describing the project)
- "techStack": string[] (3-6 specific technologies)
- "whyItMatters": string (1 sentence: why employers care about this project)
- "difficulty": "Beginner" | "Intermediate" | "Advanced"`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: 'You are a JSON API. Respond only with a valid JSON array, no markdown fences, no explanation.',
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = (message.content[0] as { text: string }).text.trim();
  return JSON.parse(extractJson(raw));
}
