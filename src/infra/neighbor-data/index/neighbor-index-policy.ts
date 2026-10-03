import { Injectable, Optional } from '@nestjs/common';
import { LocalOpenSearchIndexAdapter } from '../../local-data/local-opensearch-index.adapter';

@Injectable()
export class NeighborIndexPolicy {
  constructor(
    @Optional() private readonly fallback?: LocalOpenSearchIndexAdapter,
  ) {}

  isSyntheticIndex(index: string): boolean {
    return (
      index.endsWith('-synthetic') ||
      Boolean(this.fallback?.isSyntheticIndex(index))
    );
  }

  isSyntheticSource(sourceIndex: string): boolean {
    return (
      sourceIndex.endsWith('-synthetic') ||
      Boolean(this.fallback?.isSyntheticSource(sourceIndex))
    );
  }

  isProdContour(contour: string): boolean {
    return (
      this.fallback?.isProdContour(contour) ??
      (contour === 'prod' || contour.startsWith('prod-'))
    );
  }
}
