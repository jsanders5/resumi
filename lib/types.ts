export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  datePosted: string;
  employmentType: string;
  salary: string | null;
  source?: string;
}

export interface ScraperMeta {
  id: string;
  name: string;
  description: string;
}

export interface ScoreBreakdown {
  skills: number;        // how well resume skills match required skills
  experience: number;    // seniority / years-of-experience alignment
  domain: number;        // industry / domain knowledge match
  requirements: number;  // % of listed requirements met
}

export interface ScoredJob extends Job {
  score: number;
  matchReason: string;
  missingSkills: string[];
  breakdown: ScoreBreakdown;
  matchedSkills: string[];
  strengths: string[];
  gaps: string[];
}

export interface GitHubRecommendation {
  title: string;
  description: string;
  techStack: string[];
  whyItMatters: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}
