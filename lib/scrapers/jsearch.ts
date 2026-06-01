import { searchJobs } from '../jsearch';
import type { JobScraper } from './types';

export const jsearchScraper: JobScraper = {
  id: 'jsearch',
  name: 'JSearch',
  description: 'Aggregates Indeed + LinkedIn via RapidAPI',
  async search(query, location) {
    const jobs = await searchJobs(query, location);
    return jobs.map((j) => ({ ...j, source: 'jsearch' }));
  },
};
