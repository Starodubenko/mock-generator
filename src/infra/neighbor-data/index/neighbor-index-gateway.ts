import { Injectable, Optional } from '@nestjs/common';
import { LocalOpenSearchIndexAdapter } from '../../local-data/local-opensearch-index.adapter';
import { NeighborHttp } from '../shared/neighbor-http';

@Injectable()
export class NeighborIndexGateway {
  constructor(
    readonly http: NeighborHttp,
    @Optional() readonly fallback?: LocalOpenSearchIndexAdapter,
  ) {}

  async orFallback<T>(
    local: (adapter: LocalOpenSearchIndexAdapter) => Promise<T> | T,
    remote: () => Promise<T>,
  ): Promise<T> {
    if (this.http.optionalBaseUrl()) {
      return remote();
    }
    if (!this.fallback) {
      throw new Error(
        'INDEXER_BASE_URL is required for NeighborIndexHttpClient',
      );
    }
    return local(this.fallback);
  }
}
