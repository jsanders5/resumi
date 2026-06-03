import type { Job } from '../types';
import type { JobScraper } from './types';

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  redirect_url: string;
  created: string;
  contract_type?: string;
  salary_min?: number;
  salary_max?: number;
}

async function searchAdzuna(query: string, location: string): Promise<Job[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) throw new Error('Adzuna credentials not configured');

  const url = new URL('https://api.adzuna.com/v1/api/jobs/us/search/1');
  url.searchParams.set('app_id', appId);
  url.searchParams.set('app_key', appKey);
  url.searchParams.set('results_per_page', '10');
  url.searchParams.set('what', query);
  url.searchParams.set('content-type', 'application/json');
  if (location && location.toLowerCase() !== 'remote') {
    url.searchParams.set('where', location);
  }
  if (location.toLowerCase() === 'remote') {
    url.searchParams.set('what', `${query} remote`);
  }

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Adzuna API error: ${res.status}`);

  const data = await res.json();
  const results: AdzunaJob[] = data.results ?? [];

  return results.map((j) => {
    let salary: string | null = null;
    if (j.salary_min && j.salary_max) {
      salary = `$${Math.round(j.salary_min).toLocaleString()} – $${Math.round(j.salary_max).toLocaleString()}`;
    } else if (j.salary_min) {
      salary = `$${Math.round(j.salary_min).toLocaleString()}+`;
    }

    return {
      id: `az-${j.id}`,
      title: j.title,
      company: j.company.display_name,
      location: j.location.display_name,
      description: j.description,
      url: j.redirect_url,
      datePosted: j.created,
      employmentType: j.contract_type ?? 'FULL_TIME',
      salary,
      source: 'adzuna',
    };
  });
}

export const adzunaScraper: JobScraper = {
  id: 'adzuna',
  name: 'Adzuna',
  description: 'Official Adzuna job board API',
  search: searchAdzuna,
};
