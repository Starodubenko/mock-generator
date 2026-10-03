import { isNavActive } from './ConsoleNav';

describe('isNavActive', () => {
  it('should_mark_home_only_on_root', () => {
    expect(isNavActive('/', 'home')).toBe(true);
    expect(isNavActive('/jobs', 'home')).toBe(false);
  });

  it('should_keep_types_tab_off_train_form', () => {
    expect(isNavActive('/profiles/document', 'train')).toBe(true);
    expect(isNavActive('/profiles/document/versions', 'train')).toBe(false);
    expect(isNavActive('/document-types', 'types')).toBe(true);
    expect(isNavActive('/profiles/document/versions/abc', 'types')).toBe(
      true,
    );
    expect(isNavActive('/profiles/document', 'types')).toBe(false);
  });

  it('should_not_treat_generate_as_job_list', () => {
    expect(isNavActive('/jobs/new', 'generate')).toBe(true);
    expect(isNavActive('/jobs/new', 'jobs')).toBe(false);
    expect(isNavActive('/jobs/job-1', 'jobs')).toBe(true);
    expect(isNavActive('/mocks', 'mocks')).toBe(true);
    expect(isNavActive('/mocks', 'jobs')).toBe(false);
  });
});
