import type { Job } from './types';

interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_city: string;
  job_state: string;
  job_country: string;
  job_description: string;
  job_apply_link: string;
  job_posted_at_datetime_utc: string;
  job_employment_type: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
}

export async function searchJobs(query: string, location: string): Promise<Job[]> {
  const searchQuery = location ? `${query} in ${location}` : query;
  const url = new URL('https://jsearch.p.rapidapi.com/search');
  url.searchParams.set('query', searchQuery);
  url.searchParams.set('page', '1');
  url.searchParams.set('num_pages', '1');
  url.searchParams.set('date_posted', 'all');

  const response = await fetch(url.toString(), {
    headers: {
      'X-RapidAPI-Key': process.env.JSEARCH_API_KEY!,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
    },
  });

  if (!response.ok) {
    throw new Error(`JSearch API error: ${response.status}`);
  }

  const data = await response.json();
  const jobs: JSearchJob[] = data.data ?? [];

  return jobs.slice(0, 10).map((j) => {
    const locationParts = [j.job_city, j.job_state, j.job_country].filter(Boolean);
    let salary: string | null = null;
    if (j.job_min_salary && j.job_max_salary) {
      salary = `${j.job_salary_currency ?? '$'}${j.job_min_salary.toLocaleString()} – ${j.job_max_salary.toLocaleString()}`;
    }
    return {
      id: j.job_id,
      title: j.job_title,
      company: j.employer_name,
      location: locationParts.join(', ') || 'Remote',
      description: j.job_description,
      url: j.job_apply_link,
      datePosted: j.job_posted_at_datetime_utc,
      employmentType: j.job_employment_type,
      salary,
    };
  });
}
