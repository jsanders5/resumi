import type { Job, ScraperMeta } from '../types';

export interface JobScraper extends ScraperMeta {
  search(query: string, location: string): Promise<Job[]>;
}
