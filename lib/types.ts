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
  skills: number;
  experience: number;
  domain: number;
  requirements: number;
}

// Full analysis returned by initial search — score is always the breakdown average
export interface ScoredJob extends Job {
  score: number;
  matchReason: string;
  missingSkills: string[];
  breakdown: ScoreBreakdown;
  matchedSkills: string[];
  strengths: string[];
  gaps: string[];
}

// Returned on card expand — only the GitHub recommendations (analysis already in ScoredJob)
export interface JobDetails {
  recommendations: GitHubRecommendation[];
}

export interface GitHubRecommendation {
  title: string;
  description: string;
  techStack: string[];
  whyItMatters: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}
