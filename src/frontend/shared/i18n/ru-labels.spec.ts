import { formatJobState, formatReason } from './ru-labels';

describe('ru-labels', () => {
  it('should_translate_known_reason', () => {
    expect(formatReason('source_is_synthetic')).toContain('синтет');
    expect(formatReason('mock_group_exists')).toContain('уже есть');
    expect(formatReason('mock_endpoint_exists')).toContain('путём уже есть');
    expect(formatReason('array_path_invalid')).toContain('массивом из схемы');
  });

  it('should_translate_job_state', () => {
    expect(formatJobState('running')).toBe('публикация');
  });
});
