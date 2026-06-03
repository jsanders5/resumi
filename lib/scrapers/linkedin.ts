import { load } from 'cheerio';
import type { Job } from '../types';
import type { JobScraper } from './types';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

const LISTING_TIMEOUT_MS = 8_000;
const DESCRIPTION_TIMEOUT_MS = 5_000;

async function fetchJobDescription(jobId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`,
      { headers: HEADERS, signal: AbortSignal.timeout(DESCRIPTION_TIMEOUT_MS) }
    );
    if (!res.ok) return '';
    const html = await res.text();
    const $ = load(html);
    return (
      $('.show-more-less-html__markup').text().trim() ||
      $('.description__text').text().trim() ||
      $('[class*="description"]').first().text().trim()
    );
  } catch {
    return '';
  }
}

async function searchLinkedIn(query: string, location: string): Promise<Job[]> {
  const url = new URL(
    'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search'
  );
  url.searchParams.set('keywords', query);
  if (location) url.searchParams.set('location', location);
  url.searchParams.set('start', '0');
  url.searchParams.set('count', '10');

  const res = await fetch(url.toString(), {
    headers: HEADERS,
    signal: AbortSignal.timeout(LISTING_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`LinkedIn returned ${res.status}`);

  const html = await res.text();
  const $ = load(html);

  const stubs: {
    id: string; title: string; company: string;
    location: string; url: string; datePosted: string;
  }[] = [];

  $('li').each((_, el) => {
    const card = $(el).find('[data-entity-urn]').first();
    const urn = card.attr('data-entity-urn') ?? '';
    const jobId = urn.split(':').pop() ?? '';
    const title = card.find('.base-search-card__title').text().trim();
    const company = card.find('.base-search-card__subtitle').text().trim();
    const loc = card.find('.job-search-card__location').text().trim();
    const href =
      card.find('a.base-card__full-link').attr('href') ??
      card.find('a').first().attr('href') ?? '';
    const datetime = card.find('time').attr('datetime') ?? new Date().toISOString();

    if (jobId && title) {
      stubs.push({ id: jobId, title, company, location: loc, url: href, datePosted: datetime });
    }
  });

  if (stubs.length === 0) return [];

  // Each description fetch has its own 5s timeout; a blocked request fails fast
  const descriptions = await Promise.all(stubs.map((s) => fetchJobDescription(s.id)));

  return stubs.map((s, i) => ({
    id: `li-${s.id}`,
    title: s.title,
    company: s.company,
    location: s.location || 'Unknown',
    description: descriptions[i] || `${s.title} at ${s.company}`,
    url: s.url,
    datePosted: s.datePosted,
    employmentType: 'FULL_TIME',
    salary: null,
    source: 'linkedin',
  }));
}

export const linkedinScraper: JobScraper = {
  id: 'linkedin',
  name: 'LinkedIn',
  description: 'Scrapes LinkedIn public job listings directly',
  search: searchLinkedIn,
};
