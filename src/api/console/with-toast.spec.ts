import { withToast } from './with-toast';

describe('withToast', () => {
  it('should_append_toast_query', () => {
    expect(withToast('/jobs/abc', 'training_started')).toBe(
      '/jobs/abc?toast=training_started',
    );
    expect(withToast('/jobs/abc?contour=test-stand', 'activated')).toBe(
      '/jobs/abc?contour=test-stand&toast=activated',
    );
  });
});
