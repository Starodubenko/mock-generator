jest.mock('@nestjs/axios', () => ({
  HttpService: class HttpService {},
}));

import { of } from 'rxjs';
import type { HttpService } from '@nestjs/axios';
import { ConsoleLiveEventName } from '@entities/console-live/console-live.contract';
import { createNeighborProcessStore } from './neighbor-process.store';
import type { ProfileVersion } from '@entities/profile/profile.types';

describe('NeighborProcessStore', () => {
  const previousUrl = process.env.INDEXER_BASE_URL;

  afterEach(() => {
    process.env.INDEXER_BASE_URL = previousUrl;
  });

  it('should_post_rpc_and_rebuild_fingerprint_set', async () => {
    process.env.INDEXER_BASE_URL = 'http://indexer.test';
    const post = jest.fn().mockReturnValue(
      of({
        status: 200,
        data: {
          result: {
            versionId: 'v1',
            documentType: 'document',
            contour: 'test-stand',
            snapshotId: 'pit',
            createdAt: '2026-01-01T00:00:00Z',
            mappingIndex: 'documents-synthetic',
            paths: [],
            aliases: [],
            corpusValueFingerprints: ['aa'],
            sampleDocumentCount: 1,
            activatable: true,
          },
        },
      }),
    );
    const store = createNeighborProcessStore({
      post,
    } as unknown as HttpService);
    const profile = await store.getProfile('document', 'test-stand', 'v1');
    expect(profile?.corpusValueFingerprints).toEqual(new Set(['aa']));
    const firstCall = post.mock.calls[0] as unknown as [
      string,
      { op: string; args: Record<string, string> },
      { headers: Record<string, string> },
    ];
    expect(firstCall[0]).toBe('http://indexer.test/internal/v1/process-store');
    expect(firstCall[1]).toEqual({
      op: 'getProfile',
      args: {
        documentType: 'document',
        contour: 'test-stand',
        versionId: 'v1',
      },
    });
    expect(firstCall[2].headers['X-Service-Name']).toBe(
      'synthetic-data-generator',
    );
  });

  it('should_send_fingerprints_as_array', async () => {
    process.env.INDEXER_BASE_URL = 'http://indexer.test';
    const post = jest
      .fn()
      .mockReturnValue(of({ status: 200, data: { result: null } }));
    const store = createNeighborProcessStore({
      post,
    } as unknown as HttpService);
    const version: ProfileVersion = {
      versionId: 'v1',
      documentType: 'document',
      contour: 'test-stand',
      snapshotId: 'pit',
      createdAt: '2026-01-01T00:00:00Z',
      mappingIndex: 'documents-synthetic',
      paths: [],
      aliases: [],
      corpusValueFingerprints: new Set(['aa', 'bb']),
      sampleDocumentCount: 1,
      activatable: true,
    };
    await store.saveProfile(version);
    const saveCall = post.mock.calls[0] as unknown as [
      string,
      { args: { version: { corpusValueFingerprints: string[] } } },
    ];
    expect(saveCall[1].args.version.corpusValueFingerprints).toEqual([
      'aa',
      'bb',
    ]);
  });

  it('should_emit_job_changed_after_save_job', async () => {
    process.env.INDEXER_BASE_URL = 'http://indexer.test';
    const post = jest
      .fn()
      .mockReturnValueOnce(of({ status: 200, data: { result: null } }))
      .mockReturnValueOnce(of({ status: 200, data: { result: [] } }));
    const publish = jest.fn();
    const store = createNeighborProcessStore(
      { post } as unknown as HttpService,
      { publish },
    );
    await store.saveJob({
      jobId: 'job-n-1',
      kind: 'train',
      documentType: 'document',
      contour: 'test-stand',
      state: 'profiling',
      profileVersionId: null,
      seed: null,
      requestedCount: null,
      publishedCount: 0,
      quarantineCount: 0,
      reason: null,
      createdAt: '2026-09-27T17:00:00.000Z',
      finishedAt: null,
      checkpointDocumentNumber: 0,
      targetIndex: null,
      generatedAt: null,
    });
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ConsoleLiveEventName.JobChanged,
        jobId: 'job-n-1',
        kind: 'train',
        state: 'profiling',
        draftCount: 0,
      }),
    );
  });
});
