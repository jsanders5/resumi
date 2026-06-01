import { jsearchScraper } from './jsearch';
import { linkedinScraper } from './linkedin';
import type { JobScraper } from './types';
import type { Job, ScraperMeta } from '../types';

// Register new scrapers here — everything else picks them up automatically
export const scrapers: Record<string, JobScraper> = {
  jsearch: jsearchScraper,
  linkedin: linkedinScraper,
};

export const scraperMeta: ScraperMeta[] = Object.values(scrapers).map(
  ({ id, name, description }) => ({ id, name, description })
);

export async function searchAllSources(
  query: string,
  location: string,
  enabledIds: string[]
): Promise<Job[]> {
  const active = enabledIds.filter((id) => scrapers[id]);

  const settled = await Promise.allSettled(
    active.map((id) => scrapers[id].search(query, location))
  );

  settled.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.warn(`Scraper "${active[i]}" failed:`, r.reason);
    }
  });

  const allJobs = settled.flatMap((r) =>
    r.status === 'fulfilled' ? r.value : []
  );

  // Deduplicate by normalised title + company
  const seen = new Set<string>();
  return allJobs.filter((job) => {
    const key = `${job.title.toLowerCase().trim()}||${job.company.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
