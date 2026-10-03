import {
  ConsoleLiveEventName,
  ConsoleLiveJobKind,
  ConsoleLiveJobState,
} from '@frontend/entities/console-live/console-live.contract';
import { aliasVersionFromLiveEvent } from './alias-version-from-live-event';

describe('aliasVersionFromLiveEvent', () => {
  it('should_return_profile_version_only_for_this_succeeded_job', () => {
    const event = {
      type: ConsoleLiveEventName.JobChanged,
      jobId: 'job-1',
      contour: 'test-stand',
      kind: ConsoleLiveJobKind.Train,
      state: ConsoleLiveJobState.Succeeded,
      reason: null,
      publishedCount: 0,
      quarantineCount: 0,
      requestedCount: 10,
      draftCount: 0,
      profileVersionId: 'ver-1',
    };
    expect(aliasVersionFromLiveEvent(event, 'job-1')).toBe('ver-1');
    expect(
      aliasVersionFromLiveEvent({ ...event, jobId: 'other' }, 'job-1'),
    ).toBeNull();
    expect(
      aliasVersionFromLiveEvent(
        { ...event, state: ConsoleLiveJobState.Profiling },
        'job-1',
      ),
    ).toBeNull();
  });
});
