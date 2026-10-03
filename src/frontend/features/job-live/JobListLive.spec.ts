import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JobListLive } from './JobListLive';

const job = (jobId: string, createdAt: string) => ({
  jobId,
  kind: 'generate',
  state: 'preview',
  createdAt,
  documentType: 'document',
  requestedCount: 2,
});

describe('JobListLive html', () => {
  it('should_show_only_first_page_of_newest_jobs', () => {
    const jobs = Array.from({ length: 12 }, (_, index) => {
      const n = 12 - index;
      return job(
        `job-${String(n).padStart(2, '0')}`,
        `2026-09-${String(n).padStart(2, '0')}T10:00:00Z`,
      );
    });
    const html = renderToStaticMarkup(
      createElement(JobListLive, {
        contour: 'test-stand',
        timeZone: 'Europe/Moscow',
        jobs,
      }),
    );
    expect(html).toContain('job-12');
    expect(html).toContain('job-03');
    expect(html).not.toContain('job-02');
    expect(html).not.toContain('job-01');
    expect(html.indexOf('job-12')).toBeLessThan(html.indexOf('job-03'));
    expect(html).toContain('1–10 из 12');
  });
});
